import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, PageSection, SplitTypes, DataViewScreenSizes, PageBlock, PageSectionColumn, PageSizeTypes, PageLayout, Subscription, FindOptions } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { PageRowProjection, TempBlankPageData, IAvailableBlockData, IPageBuilderData } from './pages.model';
import { PagesValidatorService } from './pages-validator.service';

const PAGES_TABLE_NAME = 'Pages';
const DRAFT_PAGES_TABLE_NAME = 'PagesDrafts';

export class PagesApiService {
    papiClient: PapiClient;
    addonUUID: string;
    pagesValidatorService: PagesValidatorService;

    constructor(private client: Client) {
        this.addonUUID = client.AddonUUID;
        this.pagesValidatorService = new PagesValidatorService();

        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });
    }

    private getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }

    private getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    private async getAvailableBlocks(pageType: string): Promise<IAvailableBlockData[]> {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');
                
        // Distinct the addons uuid's and filter by pageType
        const distinctAddonsUuids = [...new Set(pageBlockRelations.filter(row => (
            row.AllowedPageTypes === undefined || 
            row.AllowedPageTypes.lenth === 0 || 
            pageType.length === 0 || 
            (row.AllowedPageTypes.lenth > 0 && row.AllowedPageTypes.includes(pageType))
        )).map(obj => obj.AddonUUID))];

        // Get the installed addons (for the relative path and the current version)
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach((uuid: any) => {
            addonsPromises.push(this.getInstalledAddon(uuid))
        });

        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableBlocks: IAvailableBlockData[] = [];
        pageBlockRelations.forEach((relation: NgComponentRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                availableBlocks.push({
                    relation: relation,
                    addonPublicBaseURL: installedAddon.PublicBaseURL
                });
            }
        });

        return availableBlocks;
    }
    
    private async getPage(pagekey: string, tableName: string): Promise<Page> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).key(pagekey).get() as Page;
    }

    private async getPagesFrom(tableName: string, options: FindOptions | undefined = undefined): Promise<Page[]> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).find(options) as Page[];
    }

    private async hidePage(pagekey: string, tableName: string): Promise<boolean> {
        let page = await this.getPage(pagekey, tableName);

        if (!page) {
            return Promise.reject(null);
        }

        page.Hidden = true;
        const res = await this.upsertPageInternal(page, tableName);
        return Promise.resolve(res != null);
    }

    private async upsertPageInternal(page: Page, tableName = PAGES_TABLE_NAME): Promise<Page> {
        if (!page) {
            return Promise.reject(null);
        }

        if (!page.Key) {
            page.Key = uuid();
        }

        // Validate page object before upsert.
        this.pagesValidatorService.validatePageProperties(page);

        // Validate page blocks (check that the blocks are installed and that thay are by the page type).
        const availableBlocks = await this.getAvailableBlocks(page.Type || '');
        this.pagesValidatorService.validatePageBlocks(page, availableBlocks);

        // Override the page according the interface.
        page = this.pagesValidatorService.getPageCopyAccordingInterface(page);

        return await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page) as Page;
    }

    private deleteBlockFromPage(page: Page, addonUUID: string) {
        // Get the blocks to remove by the addon UUID
        const blocksToRemove = page.Blocks.filter(block => block.Relation.AddonUUID === addonUUID);
                                
        if (blocksToRemove?.length > 0) {
            // Remove the page blocks with the addonUUID
            page.Blocks = page.Blocks.filter(block => block.Relation.AddonUUID !== addonUUID);

            // Remove the blocks from the columns.
            for (let sectioIndex = 0; sectioIndex < page.Layout.Sections.length; sectioIndex++) {
                const section = page.Layout.Sections[sectioIndex];
                
                for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                    const column = section.Columns[columnIndex];
                    
                    if (column.Block && blocksToRemove.some(btr => btr.Key === column.Block?.BlockKey)) {
                        delete column.Block;
                    }
                }
            }
        }
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/
    async getAddonUUID(installedAddonUUID: string) : Promise<string | undefined> {
        const installedAddon = await this.papiClient.addons.installedAddons.uuid(installedAddonUUID).get();
        return installedAddon?.Addon.UUID || undefined;
    }

    async createPagesTablesSchemes(): Promise<AddonDataScheme[]> {
        const promises: AddonDataScheme[] = [];
        
        // Create pages table
        const createPagesTable = await this.papiClient.addons.data.schemes.post({
            Name: PAGES_TABLE_NAME,
            Type: 'cpi_meta_data',
        });

        // Create pages draft table
        const createPagesDraftTable = await this.papiClient.addons.data.schemes.post({
            Name: DRAFT_PAGES_TABLE_NAME,
            Type: 'meta_data',
        });

        promises.push(createPagesTable);
        promises.push(createPagesDraftTable);
        return Promise.all(promises);
    }

    async getPages(options: FindOptions | undefined = undefined): Promise<Page[]> {
        return await this.getPagesFrom(PAGES_TABLE_NAME, options);
    }

    savePage(page: Page): Promise<Page> {
        return this.upsertPageInternal(page, PAGES_TABLE_NAME);
    }

    async saveDraftPage(page: Page): Promise<Page>  {
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    createTemplatePage(query: any): Promise<Page> {
        const templateId = query['templateId'] || '';
        // TODO: Get the correct page by template (options.TemplateKey)
        const page: Page = TempBlankPageData;
        page.Key = '';
        return this.upsertPageInternal(page, DRAFT_PAGES_TABLE_NAME);
    }

    async removePage(query: any): Promise<boolean> {
        const pagekey = query['key'] || '';
        
        let draftRes = false;
        try {
            draftRes = await this.hidePage(pagekey, DRAFT_PAGES_TABLE_NAME);
        } catch (e) {

        }

        let res = false;
        try {
            res = await this.hidePage(pagekey, PAGES_TABLE_NAME);
        } catch (e) {
            
        }

        return Promise.resolve(draftRes || res);
    }

    async getPagesData(options: FindOptions | undefined = undefined): Promise<PageRowProjection[]> {
        let pages: Page[] = await this.getPagesFrom(PAGES_TABLE_NAME, options);
        let draftPages: Page[] = await this.getPagesFrom(DRAFT_PAGES_TABLE_NAME, options);

        //  Add the pages into map for distinct them.
        const distinctPagesMap = new Map<string, Page>();
        pages.forEach(page => {
            if (page.Key) {
                distinctPagesMap.set(page.Key, page);
            }
        });
        draftPages.forEach(draftPage => {
            if (draftPage.Key) {
                distinctPagesMap.set(draftPage.Key, draftPage);
            }
        });

        // Convert the map values to array.
        const distinctPagesArray = Array.from(distinctPagesMap.values());
        
        const promise = new Promise<any[]>((resolve, reject): void => {
            let allPages = distinctPagesArray.map((page: Page) => {
                // Return projection object.
                const prp: PageRowProjection = {
                    Key: page.Key,
                    Name: page.Name,
                    Description: page.Description,
                    CreationDate: page.CreationDateTime,
                    ModificationDate: page.ModificationDateTime,
                    Status: draftPages.some(draft => draft.Key === page.Key) ? 'draft' : 'published',
                };

                return prp;
            });

            resolve(allPages);
        });

        return promise;
    }

    async getPageData(query: any, lookForDraft = false): Promise<IPageBuilderData> {
        let res: any;
        const pageKey = query['key'] || '';
        
        if (pageKey) {
            let page;
            
            // If lookForDraft try to get the page from the draft first.
            if (lookForDraft) {
                // Get the page from the drafts.
                page = await this.getPage(pageKey, DRAFT_PAGES_TABLE_NAME);
            }

            // If there is no page in the drafts
            if (!page || page.Hidden) {
                page = await this.getPage(pageKey, PAGES_TABLE_NAME);
            }

            // If page found get the available blocks by page type and return combined object.
            if (page) {
                const pageType = page.Type || '';
                const availableBlocks = await this.getAvailableBlocks(pageType) || [];
                 
                res = {
                    page, 
                    availableBlocks
                };
            }
        }

        const promise = new Promise<IPageBuilderData>((resolve, reject): void => {
            resolve(res);
        });

        return promise;
    }
    
    async restoreToLastPublish(query: any): Promise<boolean> {
        let res = false;
        const pagekey = query['key'];
        if (pagekey) {
            res = await this.hidePage(pagekey, DRAFT_PAGES_TABLE_NAME);
        } 

        return Promise.resolve(res);
    }

    async publishPage(page: Page): Promise<boolean> {
        let res = false;

        if (page && page.Key) {
            // Save the current page in pages table
            res = await this.upsertPageInternal(page, PAGES_TABLE_NAME) != null;

            if (res) {
                // Delete the draft.
                res = await this.hidePage(page.Key, DRAFT_PAGES_TABLE_NAME);
            }
        }

        return Promise.resolve(res);
    }

    /***********************************************************************************************/
    //                              PNS Public functions
    /************************************************************************************************/
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

    async deleteBlockFromPages(body: any, draft = false): Promise<void> {
        const obj = body?.Message?.ModifiedObjects[0];

        if (obj) {
            // If the field id is hidden AND the value is true (this block is uninstalled)
            if (obj.ModifiedFields?.filter(field => field.FieldID === 'Hidden' && field.NewValue === true)) {
                const addonUUID = await this.getAddonUUID(obj.ObjectKey);

                if (addonUUID) {
                    const tableName = draft ? DRAFT_PAGES_TABLE_NAME : PAGES_TABLE_NAME;
                    let pages = await this.getPagesFrom(tableName);
                    
                    // Delete the blocks with this addonUUID from al the pages.
                    for (let index = 0; index < pages.length; index++) {
                        const page = pages[index];
                        this.deleteBlockFromPage(page, addonUUID);
                    }
                }
            }
        }
    }
}