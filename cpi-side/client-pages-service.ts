import { IContext, IContextWithData } from "@pepperi-addons/cpi-node/build/cpi-side/events";
import { ConfigurationObject, NgComponentRelation, Page, PageBlock } from "@pepperi-addons/papi-sdk";
import { RunFlowBody } from '@pepperi-addons/cpi-node';
import { IBlockLoaderData, IPageBuilderData, IPageClientEventResult, IPageView, getAvailableBlockData, IBlockEndpointResult, SYSTEM_PARAMETERS, IPageState, PAGES_TABLE_NAME } from "shared";
import config from "../addon.config.json";

type PagesClientActionType = 'depricated-page-load' | 'page-load' | 'state-change' | 'button-click';

class ClientPagesService {
    readonly LIMIT_COUNTER = 3;

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

    private getAvailableBlockKey(addonUUID: string, name: string): string {
        return `${addonUUID}_${name}`;
    }

    private getBlockConsumedParameters(block: PageBlock, parameters: any): any {
        let parametersToSend = {};

        // If this block is consume all parameters
        if (block?.PageConfiguration?.Parameters.some(param => (param.Key === '*' && param.Consume))) {
            parametersToSend = { ...parameters };
        } else {
            Object.keys(parameters).forEach(paramKey => {
                // If this block is consume this parameter add it.
                if (block?.PageConfiguration?.Parameters.some(param => param.Key === paramKey && param.Consume)) {
                    parametersToSend[paramKey] = parameters[paramKey];
                }
            });
        }

        return parametersToSend;
    }
    
    private getConsumedParametersBlocks(pageBlocks: PageBlock[], pageParameters: any, changedParameters: any): Map<string, PageBlock> {
        // Return the cosumers of the changed params.
        const blocksMap = new Map<string, PageBlock>();
            
        // Check if we have blocks that cosume these changedParameters.
        for (let index = 0; index < pageBlocks.length; index++) {
            const block = pageBlocks[index];
            
            Object.keys(changedParameters).forEach(paramKey => {
                // If this parameter is changed or not exist.
                if (!pageParameters.hasOwnProperty(paramKey) || pageParameters[paramKey] !== changedParameters[paramKey]) {
                    // If this block is consume this parameter || consume all ('*').
                    if (block?.PageConfiguration?.Parameters.some(param => (param.Key === '*' || param.Key === paramKey) && param.Consume)) {
                        blocksMap.set(block.Key, block);
                        return;
                    }
                }
            });
        }

        return blocksMap;
    }

    private async runBlockEndpointAndSetData(pageLoadEvent: boolean, blockEndpoint: string, block: PageBlock, pageState: IPageState, 
        bodyExtra: any, updatedBlocksMap: Map<string, PageBlock> | null, context: IContext | undefined): Promise<any> {
        let changedParameters = {};

        if (blockEndpoint?.length > 0) {
            try {
                // If state is undefined set empty object.
                pageState.BlocksState[block.Key] = pageState.BlocksState[block.Key] || {};
                
                // If pageLoadEvent merge the block state with the page parameters now to give the updated state, Else it will be on the changes (bodyExtra).
                if (pageLoadEvent) {
                    // Get only the parameters that this block is consume.
                    let parametersToSend = this.getBlockConsumedParameters(block, pageState.PageParameters);
                    pageState.BlocksState[block.Key] = { ...pageState.BlocksState[block.Key], ...parametersToSend };
                }

                // Call block CPI side for getting the data to override.
                const data: any = {
                    url: blockEndpoint,
                    body: {
                        State: pageState.BlocksState[block.Key],
                        ...(bodyExtra && bodyExtra), // If there is bodyExtra set them too (This is happens in all events except PageLoad).
                        Configuration: block.Configuration.Data, // Set only the Configuration.Data into Configuration
                        ...(pageLoadEvent && { ConfigurationPerScreenSize: block.ConfigurationPerScreenSize }) // Add this only for page load event
                    },
                    ...(context && { context }) // Add context if not undefined.
                };
                
                const blockDataToOverride: IBlockEndpointResult = await pepperi.addons.api.uuid(block.Configuration.AddonUUID).post(data);

                // Override the block data
                this.overrideBlockData(pageLoadEvent, blockEndpoint, block, pageState, updatedBlocksMap, blockDataToOverride);

                // If this block return 'State' get the parameters that he's allow to change to raise this for all the consumers of these parameters.
                if (blockDataToOverride?.State) {
                    changedParameters = this.getChangedParametersIfBlockIsAllow(block, pageState.PageParameters, blockDataToOverride?.State); 
                }
            }
            catch {
                // Do nothing
            }
        } else {
            // Override the block data (the same data that is on the block).
            this.overrideBlockData(pageLoadEvent, blockEndpoint, block, pageState, updatedBlocksMap, null);
        }

        return changedParameters;
    }

    private overrideBlockData(pageLoadEvent: boolean, blockEndpoint: string, block: PageBlock, pageState: IPageState, 
        updatedBlocksMap: Map<string, PageBlock> | null, blockDataToOverride: IBlockEndpointResult | null) {
            
        if (blockDataToOverride) {
            // Only if load merge the data, Else set it as is.
            if (pageLoadEvent) {
                // NOTE: If blockDataToOverride has Configuration take it into Configuration.Data, Else take the page block Configuration.Data.
                // (cause we save it as PageBlock and only before return to client we convert it to PageBlockView).
                block.Configuration.Data = blockDataToOverride.Configuration ?? block.Configuration.Data;
                block.ConfigurationPerScreenSize = blockDataToOverride.ConfigurationPerScreenSize ?? block.ConfigurationPerScreenSize;
                pageState.BlocksState[block.Key] = { ...pageState.BlocksState[block.Key], ...blockDataToOverride.State };
            } else {
                // NOTE: Set blockDataToOverride Configuration into Configuration.Data
                // (cause we save it as PageBlock and only before return to client we convert it to PageBlockView).
                block.Configuration.Data = blockDataToOverride.Configuration;
                // block.ConfigurationPerScreenSize = blockDataToOverride.ConfigurationPerScreenSize;
                pageState.BlocksState[block.Key] = blockDataToOverride.State;
            }
        } else {
            // Get only the parameters that this block is consume.
            let parametersToSend = this.getBlockConsumedParameters(block, pageState.PageParameters);
            pageState.BlocksState[block.Key] = { ...pageState.BlocksState[block.Key], ...parametersToSend };
        }

        // Set the block in the updated map (In page load event this map is empty cause we update all the page blocks).
        if (updatedBlocksMap) {
            updatedBlocksMap.set(block.Key, block);
        }
    }

    private async overrideBlockDataOld(oldBlockCpiFunc: string, block: PageBlock, context: IContext | undefined): Promise<void> {
        if (oldBlockCpiFunc?.length > 0) {
            try {
                // Call block CPI side for getting the data to override.
                const data: any = {
                    url: oldBlockCpiFunc,
                    body: {
                        Configuration: block.Configuration
                    },
                    ...(context && { context }) // Add context if not undefined.
                };
                
                const blockDataToOverride: any = await pepperi.addons.api.uuid(block.Configuration.AddonUUID).post(data);
                block.Configuration = blockDataToOverride?.Configuration ?? block.Configuration;
            }
            catch {
                // Do nothing
            }
        }
    }

    private async overrideBlocksDataWhenParametersChange(counter: number, pageLoadEvent: boolean, page: Page, availableBlocksMap: Map<string, IBlockLoaderData>, 
        pageState: IPageState, changedParameters: any, updatedBlocksMap: Map<string, PageBlock> | null, context: IContext | undefined): Promise<void>  {

        if (counter > this.LIMIT_COUNTER) {
            throw new Error('Exceeded limit counter');
        } else {
            // Get the cosumers of the changed params.
            const consumerBlocksMap = this.getConsumedParametersBlocks(page.Blocks, pageState.PageParameters, changedParameters);
            
            // After we found the blocks that cosume these changedParameters, set the changedParameters in changedParametersToFilterFrom for filter from it after.
            let changedParametersToFilterFrom: any = { ...changedParameters }; 
            
            // If pageLoadEvent, then merge the changedParametersToFilterFrom into pageParameters, Else merge it after.
            if (pageLoadEvent) {
                pageState.PageParameters = { ...pageState.PageParameters, ...changedParametersToFilterFrom };
            }

            // Init the changedParameters for let the function run again if needed.
            changedParameters = {};
            
            // Let the blocks manipulate there data and replace it in page blocks
            const blocks: PageBlock[] = Array.from(consumerBlocksMap.values());
            await Promise.all(blocks.map(async (block: PageBlock) => {
                const currentAvailableBlock = availableBlocksMap.get(this.getAvailableBlockKey(block.Configuration.AddonUUID, block.Configuration.Resource));
    
                if (currentAvailableBlock?.relation) {
                    // If pageLoadEvent override the block data with the BlockLoadEndpoint, Else with the BlockStateChangeEndpoint.
                    const endpoint = pageLoadEvent ? currentAvailableBlock.relation.BlockLoadEndpoint : currentAvailableBlock.relation.BlockStateChangeEndpoint;
                    let bodyExtra: any = null;
                    
                    // Filter bodyExtra parameters to only parameters that this block is consume.
                    if (!pageLoadEvent) {
                        let parametersToSend = this.getBlockConsumedParameters(block, changedParametersToFilterFrom);
                        bodyExtra = { Changes: { ...parametersToSend } }; 
                    }

                    // Get the res and merge them into changedParameters.
                    const res = await this.runBlockEndpointAndSetData(pageLoadEvent, endpoint, block, pageState, bodyExtra, updatedBlocksMap, context);
                    changedParameters = { ...changedParameters, ...res };
                }
            }));

            // If not pageLoadEvent, then merge the changedParametersToFilterFrom into pageParameters.
            if (!pageLoadEvent) {
                pageState.PageParameters = { ...pageState.PageParameters, ...changedParametersToFilterFrom };
            }

            // Call to override blocks data when parameters change.
            if (Object.keys(changedParameters).length > 0) {
                await this.overrideBlocksDataWhenParametersChange(counter++, pageLoadEvent, page, availableBlocksMap, pageState, changedParameters, updatedBlocksMap, context);
            }
        }
    }

    private getAvailableBlocksMap(availableBlocks: IBlockLoaderData[]): Map<string, IBlockLoaderData> {
        // Create map for the available blocks data;
        const availableBlocksMap = new Map<string, IBlockLoaderData>();
        for (let index = 0; index < availableBlocks.length; index++) {
            const ab = availableBlocks[index];
            availableBlocksMap.set(this.getAvailableBlockKey(ab.relation.AddonUUID, ab.relation.Name), ab);
        }

        return availableBlocksMap;
    }

    private async runBlockEndpointForEventInternal(eventType: PagesClientActionType, page: Page, block: PageBlock, availableBlocksMap: Map<string, IBlockLoaderData>, 
        pageState: IPageState, bodyExtra: any, updatedBlocksMap: Map<string, PageBlock> | null, context: IContext | undefined): Promise<any> {
    
        let changedParameters = {};

        // Get the current available block
        const currentAvailableBlock = availableBlocksMap.get(this.getAvailableBlockKey(block.Configuration.AddonUUID, block.Configuration.Resource));

        if (currentAvailableBlock?.relation) {
            // Old code - this is deprecated!!!
            if (eventType === 'depricated-page-load') {
                await this.overrideBlockDataOld(currentAvailableBlock.relation.OnPageLoadEndpoint, block, context);
            } else {
                // Get the endpoint by the eventType.
                let blockEndpoint = '';
                const pageLoadEvent = eventType === 'page-load';

                if (pageLoadEvent) {
                    blockEndpoint = currentAvailableBlock.relation.BlockLoadEndpoint;
                } else if (eventType === 'state-change') {
                    blockEndpoint = currentAvailableBlock.relation.BlockStateChangeEndpoint;
                } else if (eventType === 'button-click') {
                    blockEndpoint = currentAvailableBlock.relation.BlockButtonClickEndpoint;
                }
    
                changedParameters = await this.runBlockEndpointAndSetData(pageLoadEvent, blockEndpoint, block, pageState, bodyExtra, updatedBlocksMap, context);
            }
        }
        
        return changedParameters;
    }
    
    private async runAllPageBlocksEndpointForEvent(eventType: PagesClientActionType, page: Page, availableBlocksMap: Map<string, IBlockLoaderData>, 
        pageState: IPageState, context: IContext | undefined): Promise<void> {
    
        let changedParameters = {};
        const blocks = page.Blocks;

        // Let the blocks manipulate there data and replace it in page blocks
        await Promise.all(blocks.map(async (block: any) => {
            const res = await this.runBlockEndpointForEventInternal(eventType, page, block, availableBlocksMap, pageState, null, null, context);
            changedParameters = { ...changedParameters, ...res };
        }));

        // Call to override blocks data when parameters change.
        if (Object.keys(changedParameters).length > 0) {
            await this.overrideBlocksDataWhenParametersChange(1, true, page, availableBlocksMap, pageState, changedParameters, null, context);
        }
    }

    private async runPageBlockEndpointForEvent(eventType: PagesClientActionType, page: Page, block: PageBlock, availableBlocksMap: Map<string, IBlockLoaderData>, 
        pageState: IPageState, bodyExtra: any, updatedBlocksMap: Map<string, PageBlock>, context: IContext | undefined): Promise<any> {
        
        const changedParameters = await this.runBlockEndpointForEventInternal(eventType, page, block, availableBlocksMap, pageState, bodyExtra, updatedBlocksMap, context);
        
        // Call to override blocks data when parameters change.
        if (Object.keys(changedParameters).length > 0) {
            const pageLoadEvent = eventType === 'page-load';
            await this.overrideBlocksDataWhenParametersChange(1, pageLoadEvent, page, availableBlocksMap, pageState, changedParameters, updatedBlocksMap, context);
        }

        // Update page blocks to be only the updated blocks.
        page.Blocks = Array.from(updatedBlocksMap.values());
    }

    private async isSyncInstalled(): Promise<boolean> {
        let isSyncInstalled = false;

        try {
            const res = await pepperi.api.adal.getList({
                addon: 'bb6ee826-1c6b-4a11-9758-40a46acb69c5', // CPI Node addon uuid
                table: 'addons'
            }); 
            
            isSyncInstalled = res?.objects?.length > 0 ? true : false;
        } catch {
            isSyncInstalled = false;
        }

        return isSyncInstalled;
    }

    private async getBlocksData(blockType: string = 'AddonBlock', name: string = ''): Promise<IBlockLoaderData[]> {
        let blocks;
        
        if (blockType === 'PageBlock') {
            blocks = await pepperi.addons.data['relations'].pageBlocks();
        } else { // AddonBlock
            blocks = await pepperi.addons.data['relations'].addonBlocks();
        }
        
        const addonBlocksLoaderData = this.convertRelationToBlockLoaderData(blocks, name);
        return addonBlocksLoaderData;
    }
    
    private getPageView(page: Page, pageLoadEvent: boolean, pageBlockLoadEvent = false): IPageView {
        return {
            Key: page?.Key || '',
            // Name: page.Name,
            ...(pageLoadEvent && { Name: page?.Name }),
            // Description: page.Description,
            ...(pageLoadEvent && { Description: page?.Description }),
            Blocks: page?.Blocks.map(block => { return {
                Key: block.Key,
                RelationData: {
                    Name: block.Configuration.Resource,
                    AddonUUID: block.Configuration.AddonUUID
                },
                // Set only the Configuration.Data into Configuration (the ResourceDataConfiguration object is neccessary only in PageBlock).
                Configuration: block.Configuration.Data, 
                ...((pageLoadEvent || pageBlockLoadEvent) && { ConfigurationPerScreenSize: block.ConfigurationPerScreenSize })
            }}),
            // Layout: page.Layout
            ...(pageLoadEvent && { Layout: page?.Layout }),
        }
    }

    private getChangedParametersIfBlockIsAllow(block: PageBlock, pageParameters: any, blockState: any): any {
        let changedParameters = {};

        const isBlockProducer = block.PageConfiguration?.Parameters.some(param => param.Produce);

        if (isBlockProducer) {
            // Set only the allowed parameters by find them in the PageConfiguration (that this block is produce of this parameter) 
            Object.keys(blockState).forEach(blockStatePropertyKey => {
                if (block.PageConfiguration?.Parameters.some(param => param.Produce && param.Key === blockStatePropertyKey)) {
                    if (!pageParameters.hasOwnProperty(blockStatePropertyKey) || pageParameters[blockStatePropertyKey] !== blockState[blockStatePropertyKey]) {
                        changedParameters[blockStatePropertyKey] = blockState[blockStatePropertyKey];
                    }
                }
            });
        }

        return changedParameters;
    }

    private getPageClientEventResult(pageState: IPageState, page: Page, pageLoadEvent = false, 
        availableBlocks: IBlockLoaderData[] = [], pageBlockLoadEvent = false): IPageClientEventResult {
        // Prepare the object as in the API Design.
        const pageView = this.getPageView(page, pageLoadEvent, pageBlockLoadEvent);
        const result: IPageClientEventResult = {
            State: pageState,
            PageView: pageView,
            ...(pageLoadEvent && { AvailableBlocksData: getAvailableBlockData(availableBlocks, pageState.PageParameters['devBlocks']) }),
        }

        return result;
    }

    private getMergedParameters(page: Page, pageParameters: any): any {
        // Get the system param into object
        const systemParameters = {};
        for (let index = 0; index < SYSTEM_PARAMETERS.length; index++) {
            const sp = SYSTEM_PARAMETERS[index];
            systemParameters[sp.Key] = sp.DefaultValue;
        }

        // Get the page.Parameters into object
        const savedPageParams = {};
        for (let index = 0; index < page.Parameters?.length; index++) {
            const pageParam = page.Parameters[index];
            savedPageParams[pageParam.Key] = pageParam.DefaultValue || '';
        }

        const mergedParameters = { ...systemParameters, ...savedPageParams, ...pageParameters };
        return mergedParameters;
    }

    private async runOnLoadFlow(page: Page, pageParameters: any, eventData: IContextWithData): Promise<void> {
        // If the OnLoadFlow exist run it.
        if (page?.OnLoadFlow?.FlowKey?.length > 0) {
            const mergedParameters = this.getMergedParameters(page, pageParameters);
            const dynamicParamsData: any = {};
            
            // Create dynamic params map for set the values (also for later usage when set the pageParameters).
            const dynamicParamsMap = new Map<string, string>();
            
            if (page.OnLoadFlow?.FlowParams) {
                // Get all dynamic parameters to set their value on the data property later.
                const keysArr = Object.keys(page.OnLoadFlow.FlowParams);
                for (let index = 0; index < keysArr.length; index++) {
                    const key = keysArr[index];
                    
                    if (page.OnLoadFlow.FlowParams[key].Source === 'Dynamic') {
                        const value = page.OnLoadFlow.FlowParams[key].Value;
                        dynamicParamsMap.set(key, value);

                        // Set the dynamic parameter value on the dynamicParamsData property.
                        dynamicParamsData[value] = mergedParameters[value] || '';
                    }
                }
            }
        
            const flowToRun: RunFlowBody = {
                RunFlow: page.OnLoadFlow,
                Data: dynamicParamsData,
                context: eventData
            };

            // Run the flow and set the result in pageParameters.
            const flowResult = await pepperi.flows.run(flowToRun);
            
            const resultKeys = Object.keys(flowResult);
            for (let index = 0; index < resultKeys.length; index++) {
                const key = resultKeys[index];
                
                // Override pageParameters for all the matches keys in mergedParameters object that returned in the flow result.
                const pagePropName = dynamicParamsMap.get(key);
                if (pagePropName && mergedParameters.hasOwnProperty(pagePropName)) {
                    pageParameters[pagePropName] = flowResult[key];
                } else {
                    // TODO: Override also params that are not declared (not dynamic)??
                    if (mergedParameters.hasOwnProperty(key)) {
                        pageParameters[key] = flowResult[key];
                    }
                }
            }
        }
    }

    private async getPageBuilderData(eventData: IContextWithData): Promise<IPageBuilderData> {
        let tmpResult: IPageBuilderData;
        let page = eventData.Page;
        const pageKey = eventData.PageKey || page?.Key || '';
        
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            tmpResult = {
                page: page || await this.getPage(pageKey), // If page supply take it, Else populate the page by pageKey
                availableBlocks: await this.getBlocksData('PageBlock') || [],
            }
        } else {
            // Get the page data online if sync isn't installed (in case of editor the page already exist in the data.Page,
            // data.Page and the page that will return here should be the same cause this is load event).
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/internal_api/get_page_data?key=${pageKey}`);
            tmpResult = temp.ok ? await(temp.json()) : { page: null, availableBlocks: [] };
        }

        return tmpResult;
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/

    async getPage(pageKey: string): Promise<Page> {
        // New code.
        const configurationObject: ConfigurationObject = await pepperi.addons.configurations.get(pageKey);
        return (configurationObject?.Data) as Page;

        // Old code.
        // const res = await pepperi.api.adal.get({
        //     addon: config.AddonUUID,
        //     table: PAGES_TABLE_NAME,
        //     key: pageKey
        // }); 
        // const page =  res.object as Page;
        // return page;
    }

    async getPageDataOld(pageKey: string, context: IContext | undefined): Promise<IPageBuilderData> {
        let result: IPageBuilderData;
        const isSyncInstalled = await this.isSyncInstalled();

        if (isSyncInstalled) {
            let page = await this.getPage(pageKey);
            const availableBlocks: IBlockLoaderData[] = await this.getBlocksData('PageBlock');
            const availableBlocksMap = this.getAvailableBlocksMap(availableBlocks);
            
            // This function override blocks data properties in page object.
            const pageState: IPageState = { PageParameters: {}, BlocksState: {} };
            await this.runAllPageBlocksEndpointForEvent('depricated-page-load', page, availableBlocksMap, pageState, context);
            
            result = {
                page: page,           
                availableBlocks: availableBlocks || [],
            }
        } else {
            // Get the page data online if sync isn't installed.
            const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/internal_api/get_page_data?key=${pageKey}`);
            result = temp.ok ? await(temp.json()) : null;
        }

        return result;
    }
    
    async getPageLoadData(eventData: IContextWithData): Promise<IPageClientEventResult> {
        const pageState: IPageState = eventData.State || { PageParameters: {}, BlocksState: {} };
        const tmpResult: IPageBuilderData = await this.getPageBuilderData(eventData);

        // Convert the availableBlocks to map.
        const availableBlocksMap = this.getAvailableBlocksMap(tmpResult.availableBlocks);

        // Run the OnLoadFlow before we start (for override page parameters data).
        await this.runOnLoadFlow(tmpResult.page, pageState.PageParameters, eventData);

        // This function override blocks data properties in page object.
        await this.runAllPageBlocksEndpointForEvent('page-load', tmpResult.page, availableBlocksMap, pageState, eventData);

        const result = this.getPageClientEventResult(pageState, tmpResult.page, true, tmpResult.availableBlocks);
        return result;
    }

    async getPageStateChangeData(eventData: IContextWithData): Promise<IPageClientEventResult> {
        const pageState: IPageState = eventData.State || { PageParameters: {}, BlocksState: {} };
        const keys = Object.keys(eventData.Changes.BlocksState);
        const blockKey = keys.length > 0 ? keys[0] : ''; // Take the first key - this is the block that made this change
        const tmpResult: IPageBuilderData = await this.getPageBuilderData(eventData);

        // Get the block.
        const block = tmpResult.page.Blocks.find(b => b.Key === blockKey);
 
        if (block) {
            const availableBlocksMap = this.getAvailableBlocksMap(tmpResult.availableBlocks);
            
            // Get the changes from the data (Here we send the state and the state changes to the function).
            const changes = eventData.Changes.BlocksState[block.Key];

            // Set the changes to the body extra
            const bodyExtra = { Changes: changes }; 

            // This function override blocks data properties in page object.
            const updatedBlocksMap: Map<string, PageBlock> = new Map<string, PageBlock>();
            await this.runPageBlockEndpointForEvent('state-change', tmpResult.page, block, availableBlocksMap, pageState, bodyExtra, updatedBlocksMap, eventData);
        }

        const result = this.getPageClientEventResult(pageState, tmpResult.page);
        return result;
    }

    async getPageButtonClickData(eventData: IContextWithData): Promise<IPageClientEventResult> {
        const pageState: IPageState = eventData.State || { PageParameters: {}, BlocksState: {} };
        const blockKey = eventData.BlockKey;
        const tmpResult: IPageBuilderData = await this.getPageBuilderData(eventData);
        
        // Get the block and check if he's allow to raise those params.
        const block = tmpResult.page.Blocks.find(b => b.Key === blockKey);
            
        if (block) {
            const availableBlocksMap = this.getAvailableBlocksMap(tmpResult.availableBlocks);
            
            // Set the button key to the body extra
            const bodyExtra = { ButtonKey: eventData.ButtonKey }; 

            // This function override blocks data properties in page object.
            const updatedBlocksMap: Map<string, PageBlock> = new Map<string, PageBlock>();
            await this.runPageBlockEndpointForEvent('button-click', tmpResult.page, block, availableBlocksMap, pageState, bodyExtra, updatedBlocksMap, eventData);
        }

        const result = this.getPageClientEventResult(pageState, tmpResult.page);
        return result;
    }

    // This is for editor
    async getPageBlockLoadData(eventData: IContextWithData): Promise<IPageClientEventResult> {
        const pageState: IPageState = eventData.State || { PageParameters: {}, BlocksState: {} };
        const blockKey = eventData.BlockKey;
        const tmpResult: IPageBuilderData = await this.getPageBuilderData(eventData);

        // Get the block.
        const block = tmpResult.page.Blocks.find(b => b.Key === blockKey);
 
        if (block) {
            const availableBlocksMap = this.getAvailableBlocksMap(tmpResult.availableBlocks);
            
            // This function override blocks data properties in page object.
            const updatedBlocksMap: Map<string, PageBlock> = new Map<string, PageBlock>();
            await this.runPageBlockEndpointForEvent('page-load', tmpResult.page, block, availableBlocksMap, pageState, null, updatedBlocksMap, eventData);
        }

        const result = this.getPageClientEventResult(pageState, tmpResult.page, false, [], true);
        return result;
    }

    async getBlockData(blockType: string = 'AddonBlock', name: string = ''): Promise<IBlockLoaderData | null> {
        let result: IBlockLoaderData | null = null;
        // const isSyncInstalled = await this.isSyncInstalled();

        // if (isSyncInstalled) {
            let resultArr = await this.getBlocksData(blockType, name);
            
            if (resultArr.length > 0) {
                result = resultArr[0];
            }
        // } else {
        //     // Get the page data online if sync isn't installed.
        //     const temp = await pepperi.papiClient.apiCall("GET", `addons/api/${config.AddonUUID}/addon_blocks/get_addon_block_loader_data?blockType=${blockType}&name=${name}`);
        //     result = temp.ok ? await(temp.json()) : null;
        // }
        
        return result;
    }
    
}
export default ClientPagesService;
