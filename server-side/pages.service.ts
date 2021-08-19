import { PapiClient, InstalledAddon, NgComponentRelation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { TempBlankPageData } from './pages.model';

const TABLE_NAME = 'Pages';

export class PagesService {
    papiClient: PapiClient;
    addonUUID: string;

    constructor(private client: Client) {
        this.addonUUID = client.AddonUUID;

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

    async getPageEditorData(body) {
        // Get the PageBlock relations 
        const pageBlockRelations: NgComponentRelation[] = await this.getRelations('PageBlock');

        // Distinct the addons uuid's and filter by pageType
        const pageType = body['PageType'] || '';
        const distinctAddonsUuids = [...new Set(pageBlockRelations.filter(row => (
                row.AllowedPageTypes === undefined || row.AllowedPageTypes.lenth === 0 || pageType.length === 0 || (row.AllowedPageTypes.lenth > 0 && row.AllowedPageTypes.includes(pageType))
            )).map(obj => obj.AddonUUID))];
        
        // Get the data of those installed addons
        const addonsPromises: Promise<any>[] = [];
        distinctAddonsUuids.forEach( (uuid: any) => addonsPromises.push(this.getInstalledAddon(uuid))); 
        const addons: InstalledAddon[] = await Promise.all(addonsPromises).then(res => res);

        const availableBlocks: any[] = [];
        pageBlockRelations.forEach((relation: NgComponentRelation) => {
            const installedAddon: InstalledAddon | undefined = addons.find((ia: InstalledAddon) => ia?.Addon?.UUID === relation?.AddonUUID);
            if (installedAddon) {
                // const availableAddon = this.createAvailableAddon(relation, entryAddon);
                // availableBlocks.push(availableAddon);
                availableBlocks.push({
                    relation: relation,
                    addon: installedAddon
                });
            }
        });
    
        return availableBlocks;
    }
    
    // TODO: Check that the table is not exist.
    async createPagesTableSchemes() {
        await this.papiClient.addons.data.schemes.post({
            Name: TABLE_NAME,
            Type: 'cpi_meta_data',
            Fields: {
                Name: {
                    Type: 'String'
                },
                Description: {
                    Type: 'String'
                },
                Type: {
                    Type: 'String'
                }
            }
        });
    }

    dropPagesTable() {
        // TODO: Check that this is working.
        return this.papiClient.post(`/addons/data/schemes/${TABLE_NAME}/purge`);
        // return this.papiClient.addons.data.schemes.tableName('table').purge();
    }

    getInstalledAddon(uuid: string): Promise<InstalledAddon> {
        return this.papiClient.addons.installedAddons.addonUUID(uuid).get();
    }

    getPage(options) {
        // TODO: Change to pages endpoint after added in NGINX.
        // return this.papiClient.pages.find
        // return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options);

        return { page: TempBlankPageData };
    }

    upsertPage(body) {
        if (body.Key) {
            body.Key = uuid();
        }

        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(body);
    }
}