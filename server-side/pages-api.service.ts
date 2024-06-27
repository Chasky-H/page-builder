import { PapiClient, InstalledAddon, Page, AddonDataScheme, Subscription, FindOptions, Relation, FormDataView, RecursiveImportInput, RecursiveExportInput, Draft, ConfigurationObject, SearchData } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { PageRowProjection, DEFAULT_BLANK_PAGE_DATA, IBlockLoaderData, IPageBuilderData, DEFAULT_BLOCKS_NUMBER_LIMITATION, DEFAULT_PAGE_SIZE_LIMITATION, DEFAULT_PAGES_DATA, PAGES_TABLE_NAME, CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE, CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK, CLIENT_ACTION_ON_CLIENT_PAGE_LOAD } from 'shared';
import { PagesValidatorService } from './pages-validator.service';
import { v4 as uuidv4 } from 'uuid';

export const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';
export const PAGES_VARIABLES_TABLE_NAME = 'PagesVariables';
export const JOURNEY_EVENTS_RELATION_NAME = 'JourneyEvent'

const CONFIGUTATION_UUID = '84c999c3-84b7-454e-9a86-71b7abc96554';
const CONFIGURATION_TABLE_NAME_FOR_DIMX = 'drafts_for_dimx';

export class PagesApiService {
    papiClient: PapiClient;
    addonUUID: string;
    pagesValidatorService: PagesValidatorService;
    assetsBaseUrl: string;
    bundleFileName = '';

    constructor(client: Client) {
        this.addonUUID = client.AddonUUID;
        this.pagesValidatorService = new PagesValidatorService();
        this.assetsBaseUrl = client.AssetsBaseUrl;

        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });

        this.bundleFileName = 'page_builder'; // `file_${this.addonUUID}`;
    }

    private getRelations(relationName: string): Promise<any> {
        return this.papiClient.addons.data.relations.find({where: `RelationName=${relationName}`});
    }
    
    private async upsertAddonBlockRelation() {
        const name = 'Pages';
        const blockName = 'PageBuilder';

        const addonBlockRelation: Relation = {
            RelationName: "AddonBlock",
            Name: name,
            Description: `${name} addon block`,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${blockName}Component`,
            ModuleName: `${blockName}Module`,
            ElementsModule: 'WebComponents',
            ElementName: `pages-element-${this.addonUUID}`,
        }; 
        
        await this.upsertRelation(addonBlockRelation);
    }

    private async upsertSettingsRelation() {
        const settingsName = 'Settings';
        const name = 'Pages';

        const settingsBlockRelation: Relation = {
            RelationName: "SettingsBlock",
            GroupName: name,
            SlugName: 'pages',
            Name: name,
            Description: 'Page Builder (Beta)',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${settingsName}Component`,
            ModuleName: `${settingsName}Module`,
            ElementsModule: 'WebComponents',
            ElementName: `settings-element-${this.addonUUID}`,
        }; 
        
        await this.upsertRelation(settingsBlockRelation);
    }

    private getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    async getAvailableBlocks(): Promise<IBlockLoaderData[]> {
        // Get the PageBlock relations 
        const pageBlockRelations: any[] = await this.getRelations('PageBlock');
                
        // Distinct the addons uuid's
        const distinctAddonsUuids = [...new Set(pageBlockRelations.map(obj => obj.AddonUUID))];

        // Get the installed addons (for the relative path and the current version)
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach((uuid: any) => {
            addonsPromises.push(this.getInstalledAddon(uuid))
        });

        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableBlocks: IBlockLoaderData[] = [];
        pageBlockRelations.forEach((relation: any) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                availableBlocks.push({
                    relation: relation,
                    addonPublicBaseURL: installedAddon.PublicBaseURL,
                    addonVersion: installedAddon.Version || '',
                    addon: installedAddon
                });
            }
        });

        return availableBlocks;
    }

    // private async hidePage(page: Page, tableName: string): Promise<boolean> {
    //     if (!page) {
    //         return Promise.reject(null);
    //     }

    //     page.Hidden = true;
    //     const res = await this.upsertPageInternal(page, tableName);
    //     return Promise.resolve(res != null);
    // }

    private async validateAndOverridePageAccordingInterface(page: Page, validatePagesLimit: boolean): Promise<Page> {
        // Validate pages limit number.
        if (validatePagesLimit) {
            const publishedPages = await this.getPublishedPages();
            this.pagesValidatorService.validatePagesLimitNumber(page, publishedPages);
        }

        // Validate page object before upsert.
        this.pagesValidatorService.validatePageProperties(page);

        // Validate page limitations before upsert.
        const pagesVariables = await this.getPagesVariablesInternal();
        this.pagesValidatorService.validatePageLimitations(page, pagesVariables);

        // Validate page blocks (check that the blocks are in the available blocks).
        const availableBlocks = await this.getAvailableBlocks();
        this.pagesValidatorService.validatePageData(page, availableBlocks);

        // Override the page according the interface.
        return this.pagesValidatorService.getPageCopyAccordingInterface(page, availableBlocks);
    }

    // private async upsertPageInternal(page: Page, tableName = PAGES_TABLE_NAME, validate = true): Promise<Page> {
    private async upsertPageInternal(page: Page, validate = true): Promise<Page> {
        if (!page) {
            return Promise.reject(null);
        }

        let isNewPage = !page.Key;
        if (isNewPage) {
            page.Key = uuidv4();
        }

        // Validate page object before upsert.
        if (validate) {
            // page = await this.validateAndOverridePageAccordingInterface(page, tableName === PAGES_TABLE_NAME);
            page = await this.validateAndOverridePageAccordingInterface(page, true);
        }

        const draft = this.convertPageToDraft(page);
        // const tmp = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(page.Key).get();
        const res = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.upsert(draft);

        return this.convertDraftToPage(res);
        // return this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page) as Promise<Page>;
    }

    private async getPagesVariablesInternal(options: FindOptions | undefined = undefined): Promise<any> {
        // Get the pages variables
        let pagesVariables;

        try {
            pagesVariables = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_VARIABLES_TABLE_NAME).key(PAGES_VARIABLES_TABLE_NAME).get();
        } catch {
            // Declare default.
            pagesVariables = { Key: PAGES_VARIABLES_TABLE_NAME };
        }

        // If not exist add the default value of the blocks number limitation.
        if (!pagesVariables.hasOwnProperty(DEFAULT_BLOCKS_NUMBER_LIMITATION.key)) {
            pagesVariables[DEFAULT_BLOCKS_NUMBER_LIMITATION.key] = DEFAULT_BLOCKS_NUMBER_LIMITATION.softValue;
        }

        // If not exist add the default value of the page size limitation.
        if (!pagesVariables.hasOwnProperty(DEFAULT_PAGE_SIZE_LIMITATION.key)) {
            pagesVariables[DEFAULT_PAGE_SIZE_LIMITATION.key] = DEFAULT_PAGE_SIZE_LIMITATION.softValue;
        }

        return pagesVariables;
    }
    
    private convertDraftToPage(draft: any): Page {
        return {
            Key: draft.Key,
            Name: draft.Name,
            Description: draft.Description,
            // CreationDateTime: draft.CreationDateTime,
            // ModificationDateTime: draft.ModificationDateTime,
            ...draft.Data
        } as Page
    }

    private async upsertEventsRelation(eventName, displayEventName, fields) {
        const relation = {
            Type: "AddonAPI",
            AddonUUID: this.addonUUID,
            DisplayEventName: displayEventName,
            RelationName: JOURNEY_EVENTS_RELATION_NAME,
            Name: eventName,
            Description: "",
            AddonRelativeURL: `/event_filters/get_filter_by_event?event=${eventName}`,
            Fields: fields,
        };

        await this.upsertRelation(relation);
    }

    /***********************************************************************************************/
    /*                                  Protected functions
    /***********************************************************************************************/

    protected convertPageToDraft(page: Page): Draft {
        // Unstructured data (Key, Name, Description, Hidden, CreationDateTime, ModificationDateTime, ExpirationDateTime should not be in page anymore).
        const { Key, Name, Description, Hidden, CreationDateTime, ModificationDateTime, ExpirationDateTime, ...rest } = page;

        const draft: Draft = {
            Key: Key,
            ConfigurationSchemaName: PAGES_TABLE_NAME,
            AddonUUID: this.addonUUID,
            Profiles: [],
            Data: rest,
            Name: Name || '',
            Description: Description || '',
        };

        return draft;
    }

    protected async upsertRelation(relation): Promise<any> {
        return await this.papiClient.addons.data.relations.upsert(relation);
    }

    // protected async getPagesFrom(tableName: string, options: FindOptions | undefined = undefined): Promise<Page[]> {
    // protected async getPagesFrom(options: FindOptions | undefined = undefined): Promise<Page[]> {
    //     const drafts = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.find(options);

    //     const pages: Page[] = drafts.map(draft => {
    //         return this.convertDraftToPage(draft);
    //     });
    //     return pages
    //     // return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).find(options) as Page[];
    // }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/
    
    // async getPage(pagekey: string, tableName: string = PAGES_TABLE_NAME): Promise<Page> {
    async getPage(pagekey: string): Promise<Page> {
        const draft = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(pagekey).get();
        
        return this.convertDraftToPage(draft);
        // return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
    }

    async getPublishedPage(pagekey: string): Promise<Page | undefined> {
        const configurationObjects: SearchData<ConfigurationObject> = await this.papiClient.addons.configurations.search({
            Where: `Key like '${pagekey}%'`
        });

        return configurationObjects.Objects.length > 0 ? configurationObjects.Objects[0].Data as Page : undefined;
    }

    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
        const promises: AddonDataScheme[] = [];
        
        // The input type is defined inside the papi sdk package, and called ConfigurationScheme
        const createPagesConfigurationTable = await this.papiClient.addons.configurations.schemes.upsert({
            Name: PAGES_TABLE_NAME, //the name of the configuration scheme
            AddonUUID: this.addonUUID, //the addonUUID of the addon that own this configuration
            //the interface of the configurations object
            Fields: {
                Parameters: {
                    Type: "Array",
                },
                OnLoadFlow: {
                    Type: "Object",
                },
                OnParameterChangeFlow: {
                    Type: "Object",
                },
                OnChangeFlow: {
                    Type: "Object",
                },
                Blocks: {
                    Type: "Array"
                },
                Layout: {
                    Type: "Object",
                }
            },
            SyncData: {
                Sync: true
            }
        });

        // Create pages variables table
        const createPagesVariablesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_VARIABLES_TABLE_NAME,
            Type: 'meta_data',
            Fields: {
                Key: {
                    Type: 'String'
                }
            },
            SyncData: {
                Sync: true
            }
        });

        // promises.push(createPagesTable);
        // promises.push(createPagesDraftTable);
        promises.push(createPagesConfigurationTable);
        promises.push(createPagesVariablesTable);
        return Promise.all(promises);
    }

    async upsertJourneyEventsRelation() {
        const promises = [
            this.upsertEventsRelation(CLIENT_ACTION_ON_CLIENT_PAGE_LOAD, "Page load", [{"FieldID": "PageKey"}]),
            this.upsertEventsRelation(CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE, "Page block state change", [{"FieldID": "PageKey"}, {"FieldID": "Changes"}]),
            this.upsertEventsRelation(CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK, "Page block button click", [{"FieldID": "PageKey"}, {"FieldID": "BlockKey"}, {"FieldID": "ButtonKey"}]),
        ];
        Promise.all(promises);
    }

    async upsertPagesRelations(): Promise<void> {
        await this.upsertVarSettingsRelation();
        
        // Create DIMX relations
        await this.upsertRelation(this.getImportRelation());
        await this.upsertRelation(this.getExportRelation());

        await this.upsertAddonBlockRelation();
        await this.upsertSettingsRelation();
        await this.upsertJourneyEventsRelation();
    }

    async getPublishedPages(options: FindOptions | undefined = undefined): Promise<Page[]> {
        const drafts = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.find(options);
        const publishedDrafts = drafts.filter(draft => { return draft.PublishedVersion && draft.PublishedVersion.length > 0 });

        const pages: Page[] = publishedDrafts.map(draft => {
            return this.convertDraftToPage(draft);
        });
        return pages;
    }

    // savePage(page: Page): Promise<Page> {
    //     return this.upsertPageInternal(page, PAGES_TABLE_NAME);
    // }

    saveDraftPage(page: Page): Promise<Page>  {
        page.Hidden = false;
        // return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
        return this.upsertPageInternal(page);
    }

    async createTemplatePage(query: any): Promise<Page> {
        const templateFileName = query['templateFileName'] || '';
        const pageNum = query['pageNum'] || '0';
        
        let page;
        try {
            // For production.
            // const url = path.join(this.assetsBaseUrl.replace('assets', 'template_pages'), `${templateFileName}.json`);
            // const response = await fetch(url);
            // const textData:string = await response.text();
            // const page = JSON.parse(textData);

            // For local dev server
            // const filePath = path.join(process.cwd(), `template_pages/${templateFileName}.json`);
            // let buffer = readFileSync(filePath);
            // page = JSON.parse(buffer);

            page = DEFAULT_PAGES_DATA[templateFileName];

            console.log(page);
        } catch (error) {
            console.log(error);
            // If file is not exist or some other reson.
            page = JSON.parse(JSON.stringify(DEFAULT_BLANK_PAGE_DATA)) ;
        }

        page.Name = `${page.Name} ${pageNum}`;
        page.Description = `${page.Description} ${pageNum}`;

        page.Key = '';
        // return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
        return this.upsertPageInternal(page);
    }

    // async removePage(query: any): Promise<boolean> {
    //     const pagekey = query['key'] || '';
        
    //     if (pagekey.length > 0) {
    //         const draft = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(pagekey).get();
    //         draft.Hidden = true;
    //         const res = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.upsert(draft);
    //         return Promise.resolve(res != null);
    //     } else {
    //         return Promise.resolve(false);
    //     }

    //     // Old code
    //     // let draftRes = false;
    //     // let res = false;

    //     // if (pagekey.length > 0) {
    //     //     let pageDeleted = false;
    //     //     let draftExceptionMessage;
    //     //     let exceptionMessage;

    //     //     try {
    //     //         let page = await this.getPage(pagekey, DRAFT_PAGES_TABLE_NAME);
    //     //         draftRes = await this.hidePage(page, DRAFT_PAGES_TABLE_NAME);
    //     //         pageDeleted = true;
    //     //     } catch (e) {
    //     //         draftExceptionMessage = e;
    //     //     }
    
    //     //     try {
    //     //         let page = await this.getPage(pagekey, PAGES_TABLE_NAME);
    //     //         res = await this.hidePage(page, PAGES_TABLE_NAME);
    //     //         pageDeleted = true;
    //     //     } catch (e) {
    //     //         exceptionMessage = e;
    //     //     }

    //     //     if (!pageDeleted) {
    //     //         throw new Error(`${draftExceptionMessage} and ${exceptionMessage}.`);
    //     //     }
    //     // }

    //     // return Promise.resolve(draftRes || res);
    // }

    // async duplicatePage(query: any): Promise<Page> {
    //     const pagekey = query['key'];
        
    //     if (pagekey) {
    //         // TODO: *** Maybe we should use import export here ***
    //         let draft: Draft = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(pagekey).get();
            
    //         // const pageData: IPageBuilderData = await this.getPageData(query);

    //         const dupplicateDraft: Draft = JSON.parse(JSON.stringify(draft));
    //         dupplicateDraft.Name = `${dupplicateDraft.Name} copy`;
    //         delete dupplicateDraft.Key;
    //         // return await this.upsertPageInternal(dupplicatePage, DRAFT_PAGES_TABLE_NAME);
    //         return await this.upsertPageInternal(this.convertDraftToPage(dupplicateDraft));
    //     }
        
    //     return Promise.reject(null);
    // }

    async getPagesData(options: FindOptions | undefined = undefined): Promise<PageRowProjection[]> {
        const drafts = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.find(options);
        
        // Filter.
        let filteredDrafts: Draft[] = drafts;
        
        if (options?.where !== undefined && options?.where?.length > 0) {
            const searchString = options?.where;
            filteredDrafts = drafts.filter(draft => draft.Name?.includes(searchString) || draft.Description?.includes(searchString))
        }

        const promise = new Promise<any[]>((resolve, reject): void => {
            let allPages = filteredDrafts.map((draft: Draft) => {
                
                // Return projection object.
                const prp: PageRowProjection = {
                    Key: draft.Key,
                    Name: draft.Name,
                    Description: draft.Description,
                    CreationDate: draft.CreationDateTime,
                    ModificationDate: draft.ModificationDateTime,
                    Published: draft.PublishedVersion !== undefined && draft.PublishedVersion.length > 0,
                    IsDirty: draft.IsDirty
                };

                return prp;
            });

            // Sort.
            if (options?.order_by !== undefined && options?.order_by?.length > 0) {
                const orderByArr = options?.order_by.split(' ');
                const orderBy = orderByArr[0] || 'Name';
                const isAsc = orderByArr.length === 2 ? orderByArr[1] === 'ASC' : true;

                allPages = allPages.sort((p1, p2) =>
                    p1[orderBy] > p2[orderBy] ? 
                        (isAsc ? 1 : -1) : 
                        (p1[orderBy] < p2[orderBy] ? (isAsc ? -1 : 1) : 0)
                );
            }

            resolve(allPages);
        });

        return promise;
    }

    async getPageData(query: any): Promise<IPageBuilderData> {
        let res: any;
        const pageKey = query['key'] || '';
        
        if (pageKey) {
            let needToFixDraftIfNotExist = false;
            
            const dataPromises: Promise<any>[] = [];
            dataPromises.push(this.getAvailableBlocks());
            dataPromises.push(this.getPublishedPage(pageKey));
                
            const arr = await Promise.all(dataPromises).then(res => res);

            res = {
                availableBlocks: arr[0] || [],
                page: arr[1],
            }
        }

        const promise = new Promise<IPageBuilderData>((resolve, reject): void => {
            resolve(res);
        });

        return promise;
    }

    async getPageBuilderData(query: any): Promise<IPageBuilderData> {
        let res: any;
        const pageKey = query['key'] || '';
        
        if (pageKey) {
            let needToFixDraftIfNotExist = false;
            
            const dataPromises: Promise<any>[] = [];
            dataPromises.push(this.getAvailableBlocks());
            dataPromises.push(this.getPagesVariablesInternal());
            dataPromises.push(this.getPage(pageKey));
                
            const arr = await Promise.all(dataPromises).then(res => res);

            res = {
                availableBlocks: arr[0] || [],
                pagesVariables: arr[1] || [],
                page: arr[2],
            }
        }

        const promise = new Promise<IPageBuilderData>((resolve, reject): void => {
            resolve(res);
        });

        return promise;
    }
    
    // async restoreToLastPublish(query: any): Promise<Page> {
    //     const pagekey = query['key'];
        
    //     if (pagekey) {
    //         let draft = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(pagekey).get();
            
    //         if (draft.PublishedVersion?.length > 0) {
    //             draft = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(pagekey).restore(draft.PublishedVersion);
    //         }

    //         return Promise.resolve(this.convertDraftToPage(draft));

    //         // Old code
    //         // let page = await this.getPage(pagekey, PAGES_TABLE_NAME);

    //         // // In case that the page was never published.
    //         // if (!page) {
    //         //     page = await this.getPage(pagekey, DRAFT_PAGES_TABLE_NAME);
    //         //     return await this.upsertPageInternal(page, PAGES_TABLE_NAME);
    //         //     // return this.publishPage(page);
    //         // } else {
    //         //     // const pageCopy = JSON.parse(JSON.stringify(page));
    //         //     // await this.hidePage(pageCopy, DRAFT_PAGES_TABLE_NAME);
    //         //     // return pageCopy;

    //         //     return await this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    //         // }
    //     }
        
    //     return Promise.reject(null);
    // }

    async publishPage(page: Page): Promise<Page> {
        let res: Page | null = null;
        
        if (page?.Key) {
            res = await this.upsertPageInternal(page);
            await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(page.Key).publish();
            return res;
            
            // Old code
            // // Save the current page in pages table
            // res = await this.upsertPageInternal(page, PAGES_TABLE_NAME);

            // // Update the draft page and hide it.
            // if (res != null) {
            //     // const pageCopy = JSON.parse(JSON.stringify(page));
            //     // this.hidePage(pageCopy, DRAFT_PAGES_TABLE_NAME);
            //     await this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
            // }
            
            // return Promise.resolve(res);
        }

        return Promise.reject(null);
    }
    
    /***********************************************************************************************/
    //                              VarSettings functions
    /************************************************************************************************/
    
    private async upsertVarSettingsRelation(): Promise<void> {
        const title = 'Pages variables'; // The title of the tab in which the fields will appear;
        const dataView: FormDataView = {
            Type: 'Form',
            Context: {
                Object: {
                    Resource: "None",
                    InternalID: 1,
                },
                Name: 'Pages variables data view',
                ScreenSize: 'Tablet',
                Profile: {
                    InternalID: 1,
                    Name: 'MyProfile'
                }
            },
            Fields: [{
                FieldID: DEFAULT_BLOCKS_NUMBER_LIMITATION.key,
                Type: 'NumberInteger',
                Title: 'Blocks number limitation',
                Mandatory: false,
                ReadOnly: false,
                Layout: {
                    Origin: {
                        X: 0,
                        Y: 0
                    },
                    Size: {
                        Width: 1,
                        Height: 0
                    }
                },
                Style: {
                    Alignment: {
                        Horizontal: 'Stretch',
                        Vertical: 'Stretch'
                    }
                }
            }, {
                FieldID: DEFAULT_PAGE_SIZE_LIMITATION.key,
                Type: 'NumberInteger',
                Title: 'Blocks size limitation',
                Mandatory: false,
                ReadOnly: false,
                Layout: {
                    Origin: {
                        X: 0,
                        Y: 1
                    },
                    Size: {
                        Width: 1,
                        Height: 0
                    }
                },
                Style: {
                    Alignment: {
                        Horizontal: 'Stretch',
                        Vertical: 'Stretch'
                    }
                }
            }]
        };
        
        // Create new var settings relation.
        const varSettingsRelation: Relation = {
            RelationName: 'VarSettings',
            Name: PAGES_VARIABLES_TABLE_NAME,
            Description: 'Set pages variables from var settings',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/api/pages_variables',
            Title: title,
            DataView: dataView
        };                

        await this.upsertRelation(varSettingsRelation);
    }

    async savePagesVariables(varSettingsParams: any) {
        const blocksNumberLimitationValue = Number(varSettingsParams[DEFAULT_BLOCKS_NUMBER_LIMITATION.key]);
        const pageSizeLimitationValue = Number(varSettingsParams[DEFAULT_PAGE_SIZE_LIMITATION.key]);

        if (!isNaN(blocksNumberLimitationValue) && !isNaN(pageSizeLimitationValue)) {
            if (blocksNumberLimitationValue < 1 || blocksNumberLimitationValue > DEFAULT_BLOCKS_NUMBER_LIMITATION.hardValue) {
                throw new Error(`${DEFAULT_BLOCKS_NUMBER_LIMITATION.key} should be in the range (1 - ${DEFAULT_BLOCKS_NUMBER_LIMITATION.hardValue}).`);
            }
        
            if (pageSizeLimitationValue < 1 || pageSizeLimitationValue > DEFAULT_PAGE_SIZE_LIMITATION.hardValue) {
                throw new Error(`${DEFAULT_PAGE_SIZE_LIMITATION.key} should be in the range (1 - ${DEFAULT_PAGE_SIZE_LIMITATION.hardValue}).`);
            }
        
            // Save the key on the object for always work on the same object.
            varSettingsParams['Key'] = PAGES_VARIABLES_TABLE_NAME;
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_VARIABLES_TABLE_NAME).upsert(varSettingsParams);
        } else {
            let nanVariableName = isNaN(blocksNumberLimitationValue) ? DEFAULT_BLOCKS_NUMBER_LIMITATION.key : DEFAULT_PAGE_SIZE_LIMITATION.key;
            throw new Error(`${nanVariableName} is not a number.`);
        }
    }

    async getPagesVariables(options: FindOptions | undefined = undefined): Promise<any> {
        return await this.getPagesVariablesInternal(options);
    }

    /***********************************************************************************************/
    //                              Import & Export functions
    /************************************************************************************************/
    
    private async getDIMXResult(body: any, isImport: boolean): Promise<any> {
        // Validate the pages.
        if (body.DIMXObjects?.length > 0) {
            console.log('@@@@@@@@ getDIMXResult - enter ', JSON.stringify(body));
            console.log('@@@@@@@@ getDIMXResult - isImport = ', isImport);

            for (let index = 0; index < body.DIMXObjects.length; index++) {
                const dimxObject = body.DIMXObjects[index];
                try {
                    const page = await this.validateAndOverridePageAccordingInterface(dimxObject['Object'], isImport);
                    
                    // For import always generate new Key and set the Hidden to false.
                    if (isImport) {
                        page.Key = page.Key && page.Key.length > 0 ? page.Key : uuidv4();
                        page.Hidden = false;
                    }
                    dimxObject['Object'] = page;
                } catch (err) {
                    // Set the error on the page.
                    dimxObject['Status'] = 'Error';
                    dimxObject['Details'] = err ? err['message'] : '';
                }
            }

            console.log('@@@@@@@@ getDIMXResult - exit ', JSON.stringify(body));
        }
        
        return body;
    }

    private getImportRelation(): Relation {
        const importRelation: Relation = {
            RelationName: 'DataImportResource',
            Name: PAGES_TABLE_NAME, //DRAFT_PAGES_TABLE_NAME,
            Description: 'Pages import',
            Source: 'configurations',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/internal_api/draft_pages_import', // '/api/pages_import',
            MappingRelativeURL: ''// '/internal_api/draft_pages_import_mapping', // '/api/pages_import_mapping',
        };                

        return importRelation;
    }

    private getExportRelation(): Relation {
        const exportRelation: Relation = {
            RelationName: 'DataExportResource',
            Name: PAGES_TABLE_NAME, //DRAFT_PAGES_TABLE_NAME,
            Description: 'Pages export',
            Source: 'configurations',
            Type: 'AddonAPI',
            AddonUUID: this.addonUUID,
            AddonRelativeURL: '/internal_api/draft_pages_export', // '/api/pages_export',
        };                

        return exportRelation;
    }

    async importPages(body: any, draft = true): Promise<any> {
        console.log('@@@@@@@@ importPages - before getDIMXResult');

        const res = await this.getDIMXResult(body, true);
        
        console.log('@@@@@@@@ importPages - after getDIMXResult');

        return res;
    }

    // NOTE: This function is not used TBD.
    // async importMappingPages(body: any, draft = true): Promise<any> {
    //     const res = {};
        
    //     // Change the page key to a new one.
    //     if (body.Objects?.length > 0) {
    //         body.Objects.forEach((page: Page) => {
    //             if (page.Key) {
    //                 res[page.Key] = {
    //                     Action: 'Replace',
    //                     NewKey: uuidv4()
    //                 };
    //             }
    //         });
    //     }

    //     return res;
    // }
    
    async exportPages(body: any, draft = true): Promise<any> {
        const res = await this.getDIMXResult(body, false);
        return res;
    }

    private getDimxAdditionalData(): any {
        const additionalData = {
            AddonUUID: this.addonUUID,
            ConfigurationSchemeName: PAGES_TABLE_NAME
        };

        return additionalData;
    }

    async importPageFile(body: RecursiveImportInput) {
        body["AdditionalData"] = this.getDimxAdditionalData();
        return await this.papiClient.addons.data.import.file.recursive.uuid(CONFIGUTATION_UUID).table(CONFIGURATION_TABLE_NAME_FOR_DIMX).upsert(body);
    }

    async exportPageFile(body: RecursiveExportInput) {
        body["AdditionalData"] = this.getDimxAdditionalData();
        return await this.papiClient.addons.data.export.file.recursive.uuid(CONFIGUTATION_UUID).table(CONFIGURATION_TABLE_NAME_FOR_DIMX).get(body);
    }

    /***********************************************************************************************/
    //                              PNS functions
    /************************************************************************************************/
    
    private async deleteBlockFromPage(draft: Draft, addonUUID: string) {
        const page = this.convertDraftToPage(draft);
        
        // Get the blocks to remove by the addon UUID
        const blocksToRemove = page.Blocks.filter(block => block.Configuration.AddonUUID === addonUUID);

        if (blocksToRemove?.length > 0) {
            console.log(`page blocks before - ${JSON.stringify(page.Blocks)}`);

            // Remove the page blocks with the addonUUID
            page.Blocks = page.Blocks.filter(block => block.Configuration.AddonUUID !== addonUUID);

            console.log(`page blocks after - ${JSON.stringify(page.Blocks)}`);

            // Remove the blocks from the columns.
            for (let sectioIndex = 0; sectioIndex < page.Layout.Sections.length; sectioIndex++) {
                const section = page.Layout.Sections[sectioIndex];
                
                for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                    const column = section.Columns[columnIndex];
                    
                    if (column.BlockContainer && blocksToRemove.some(btr => btr.Key === column.BlockContainer?.BlockKey)) {
                        console.log(`delete block with the key - ${JSON.stringify(column.BlockContainer.BlockKey)}`);
                        delete column.BlockContainer;
                    }
                }
            }

            await this.upsertPageInternal(page, false);

            // Old code
            // Update the page with no validation here.
            // this.upsertPageInternal(page, tableName, false);
            // await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page);
        }
    }

    private getAddonUUID(installedAddonUUID: string): Promise<string | undefined>  {
        // need to use where clause b/c currently there is no endpoint for
        // retrieving an installed addon by UUID
        return this.papiClient.addons.installedAddons
            .find({
                where: `UUID = '${installedAddonUUID}'`,
                include_deleted: true,
            })
            .then((res) => res[0]?.Addon.UUID || undefined);
    }

    async subscribeUninstallAddons(key: string, functionPath: string): Promise<Subscription> {
        return await this.papiClient.notification.subscriptions.upsert({
            Key: key,
            AddonUUID: this.addonUUID,
            AddonRelativeURL: functionPath,
            Type: 'data',
            Name: key,
            FilterPolicy: {
                Action: ['update'],
                ModifiedFields: ['Hidden'],
                Resource: ['installed_addons'],
                AddonUUID: ['00000000-0000-0000-0000-000000000a91']
            }
        });
    }
    
    async unsubscribeUninstallAddons(key: string, functionPath: string): Promise<Subscription> {
        return await this.papiClient.notification.subscriptions.upsert({
            Hidden: true,
            Key: key,
            AddonUUID: this.addonUUID,
            AddonRelativeURL: functionPath,
            Type: 'data',
            Name: key,
            FilterPolicy: {}
        });
    }

    // async deleteBlockFromPages(body: any, draft = false): Promise<void> {
    async deleteBlockFromPages(body: any): Promise<void> {
        for (let modifiedObjectIndex = 0; modifiedObjectIndex < body?.Message?.ModifiedObjects.length; modifiedObjectIndex++) {
            const obj = body?.Message?.ModifiedObjects[modifiedObjectIndex];
            
            if (obj) {
                console.log(`obj - ${JSON.stringify(obj)}`);

                // If the field id is hidden AND the value is true (this block is uninstalled)
                if (obj.ModifiedFields?.filter(field => field.FieldID === 'Hidden' && field.NewValue === true)) {
                    console.log(`obj.ObjectKey - ${obj.ObjectKey}`);
                    const addonUUID = await this.getAddonUUID(obj.ObjectKey);

                    console.log(`addonUUID - ${addonUUID}`);

                    if (addonUUID) {
                        // const tableName = draft ? DRAFT_PAGES_TABLE_NAME : PAGES_TABLE_NAME;
                        // console.log(`tableName - ${tableName}`);

                        const drafts = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.find();
                        // let pages = await this.getPagesFrom();
                        
                        console.log(`pages length - ${drafts.length}`);

                        // Delete the blocks with this addonUUID from all the pages.
                        for (let index = 0; index < drafts.length; index++) {
                            const draft = drafts[index];
                            console.log(`draft before - ${JSON.stringify(draft)}`);

                            // Copy the draft to a new object.
                            let draftCopy = JSON.parse(JSON.stringify(draft));

                            // If this draft is dirty then remove the blocks from the published version and publish it again, then remove the blocks from the draft copy.
                            if (draft.Dirty) {
                                if (draft.Key && draft.PublishedVersion && draft.PublishedVersion.length > 0) {
                                    const publishedDraft = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(draft.Key).restore(draft.PublishedVersion);
                                    await this.deleteBlockFromPage(publishedDraft, addonUUID);
                                    await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(draft.Key).publish();
                                }
                            }

                            await this.deleteBlockFromPage(draftCopy, addonUUID);

                            console.log(`draft after - ${JSON.stringify(draft)}`);
                        }
                    }
                }
            }
        }
    }
    
    /***********************************************************************************************/
    //                              Addon block data Public functions
    /************************************************************************************************/
    
    async getBlockLoaderData(name: string, blockType: string, slugName: string, addonUUID: string): Promise<IBlockLoaderData> {
        const promise = new Promise<IBlockLoaderData>(async (resolve, reject) => {
            // Get the addon blocks relations 
            const whereName = (name.length > 0) ? `AND Name="${name}"`: '';

            let addonBlockRelations: any[] = await this.papiClient.addons.data.relations.find(
                {where: `RelationName=${blockType} ${whereName}`}
            );
            
            if (addonBlockRelations.length > 0) {
                // If the addonUUID is not empty and the addonBlockRelations has more then 1 blocks ? take the relevant.
                if (addonUUID.length > 0 && addonBlockRelations.length > 1) {
                    addonBlockRelations = addonBlockRelations.filter(abr => abr.AddonUUID === addonUUID);
                }

                // If the slugName is not empty and the addonBlockRelations has more then 1 blocks ? take the relevant.
                if (slugName.length > 0 && addonBlockRelations.length > 1) {
                    addonBlockRelations = addonBlockRelations.filter(abr => abr.SlugName === slugName);
                }

                const addonBlockRelation: any = addonBlockRelations[0];
                const installedAddon: InstalledAddon | undefined = await this.getInstalledAddon(addonBlockRelation.AddonUUID);
                if (installedAddon) {
                    resolve({
                        relation: addonBlockRelation,
                        addonPublicBaseURL: installedAddon.PublicBaseURL,
                        addonVersion: installedAddon.Version || '',
                        addon: installedAddon
                    });
                }
            }
        
            reject(null);
        });

        return promise;
    }

    /***********************************************************************************************/
    //                              Journey functions
    /************************************************************************************************/
    
    async getPagesOptionalValues(options: FindOptions | undefined = undefined): Promise<{Key: string, Value: any}[]> {
        let res: {Key: string, Value: any}[] = [];
        const drafts = await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.find(options);

        if (drafts?.length > 0) {
            res = drafts.map(draft => {
                return { Key: draft.Key || '', Value: draft.Name }
            });
        }

        return res;
    }
}