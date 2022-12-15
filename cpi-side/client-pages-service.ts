import { NgComponentRelation, Page } from "@pepperi-addons/papi-sdk";
import { IBlockLoaderData, IPageBuilderData } from "shared";

class ClientPagesService {
    
    private convertRelationToBlockLoaderData(relations: NgComponentRelation[], name: string = ''): IBlockLoaderData[] {
        const availableBlocks: IBlockLoaderData[] = [];
        relations.forEach((relation: NgComponentRelation) => {
            if (name.length === 0 || (name.length > 0 && relation.Name === name)) {
                availableBlocks.push({
                    relation: relation,
                    addonPublicBaseURL: `${relation.AddonBaseURL}`,
                } as any);
            }
        });

        return availableBlocks;
    }

    private async overrideBlocksData(page: Page, availableBlocks: IBlockLoaderData[]): Promise<void> {
        // Let the blocks manipulate there data and replace it in page blocks
        await Promise.all(page.Blocks.map(async (block: any) => {
            const blockRelation = block.Relation;
            const currentAvailableBlock = availableBlocks.find(ab => ab.relation.AddonUUID === blockRelation.AddonUUID && ab.relation.Name === blockRelation.Name);
            const blockCpiFunc = currentAvailableBlock?.relation.CPINodeEndpoint;

            if (blockCpiFunc?.length > 0) {
                try {
                    // Call block CPI side for getting the data to override.
                    const data: any = {
                        AddonUUID: blockRelation.AddonUUID,
                        RelativeURL: blockCpiFunc,
                        Method: 'POST',
                        Body: { 
                            Configuration: block.Configuration
                        }
                    }
                
                    const blockDataToOverride: any = (await pepperi.events.emit('AddonAPI', data)).data;
                    if (blockDataToOverride.Success) {
                        const value = JSON.parse(blockDataToOverride.Value);
                        block.Configuration = value.Configuration;
                    }
                }
                catch {
                    // Do nothing
                }
            }
        }));
    }

    async getPage(pageKey: string): Promise<Page> {
        const res = await pepperi.api.adal.get({
            addon: '50062e0c-9967-4ed4-9102-f2bc50602d41', // pages addon
            table: 'Pages',
            key: pageKey
        }); 
        const page =  res.object as Page;
        return page;
    }

    async getPageData(pageKey: string): Promise<IPageBuilderData> {
        let page = await this.getPage(pageKey);
        const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');

        // This function override blocks data properties in page object.
        await this.overrideBlocksData(page, availableBlocks);

        const result: IPageBuilderData = {
            page: page,           
            availableBlocks: availableBlocks || [],
        }

        return result;
    }
    
    async getBlocksData(blockType: string = 'AddonBlock', name: string = ''): Promise<IBlockLoaderData[]> {
        let blocks;
        
        if (blockType === 'PageBlock') {
            blocks = await pepperi.addons.data['relations'].pageBlocks();
        } else { // AddonBlock
            blocks = await pepperi.addons.data['relations'].addonBlocks();
        }
        
        const addonBlocksLoaderData = this.convertRelationToBlockLoaderData(blocks, name);
        return addonBlocksLoaderData;
    }
    
}
export default ClientPagesService;
