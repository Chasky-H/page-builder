import { DataViewScreenSizes, Page, PageBlock, PageLayout, PageSection, PageSectionColumn, PageSizeTypes, SplitTypes, ResourceDataConfiguration, ScreenSizeDataConfiguration, PageConfiguration, PageConfigurationParameter } from "@pepperi-addons/papi-sdk";
import { DEFAULT_BLOCKS_NUMBER_LIMITATION, DEFAULT_PAGE_SIZE_LIMITATION, IBlockLoaderData, PAGES_NUBER_LIMITATION } from 'shared'
import { TextEncoder } from "util";

export class PagesValidatorService {

    constructor() {}

    private getNotExistError(objectBreadcrumb: string, propertyName: string): string {
        return `${objectBreadcrumb} -> ${propertyName} is missing.`;
    }
    
    private getWrongTypeError(objectBreadcrumb: string, propertyName: string, typeName: string): string {
        return `${objectBreadcrumb} -> ${propertyName} should be ${typeName}.`;
    }

    private validateObjectProperty(objectToValidate: any, propName: string, propertyBreadcrumb: string, optional: boolean = false, objectType: string = 'string') {
        if (!optional) {
            if (!objectToValidate.hasOwnProperty(propName)) {
                throw new Error(this.getNotExistError(propertyBreadcrumb, propName));
            } else if (typeof objectToValidate[propName] !== objectType) {
                throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, objectType));
            }
        } else {
            if (objectToValidate.hasOwnProperty(propName)) {
                if (typeof objectToValidate[propName] !== objectType) {
                    throw new Error(this.getWrongTypeError(propertyBreadcrumb, 'Configuration', objectType));
                }
            }
        }
    }

    private validateArrayProperty(objectToValidate: any, propName: string, propertyBreadcrumb: string, optional: boolean = false, arrayType: readonly any[] = []) {
        if (!optional) {
            if (!objectToValidate.hasOwnProperty(propName)) {
                throw new Error(this.getNotExistError(propertyBreadcrumb, propName));
            } else if (!Array.isArray(objectToValidate[propName])) {
                throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, 'array'));
            }
        } else {
            if (objectToValidate.hasOwnProperty(propName)) {
                if (!Array.isArray(objectToValidate[propName])) {
                    throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, 'array'));
                } else {
                    for (let index = 0; index < objectToValidate[propName].length; index++) {
                        const value = objectToValidate[propName][index];
                        if (arrayType.length > 0 && !arrayType.some(atv => atv === value)) {
                            throw new Error(this.getWrongTypeError(propertyBreadcrumb, propName, `value from [${arrayType}]`));
                        }
                    }
                }
            }
        }
    }

    private validatePageBlockProperties(pagePropertyBreadcrumb: string, block: PageBlock, blockIndex: number): void {
        const blocksPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Blocks at index ${blockIndex}`;

        // Validate Key
        this.validateObjectProperty(block, 'Key', blocksPropertyBreadcrumb);

        // *** Relation is depricated ***
        // // Validate Relation
        // this.validateObjectProperty(block, 'Relation', blocksPropertyBreadcrumb, false, 'object');
        // this.validateBlockRelationProperties(blocksPropertyBreadcrumb, block.Relation);
        
        // Validate Configuration
        this.validateObjectProperty(block, 'Configuration', blocksPropertyBreadcrumb, false, 'object');
        this.validateBlockConfigurationProperties(blocksPropertyBreadcrumb, block.Configuration);
        
        // Validate ConfigurationPerScreenSize if exist (Optional)
        this.validateObjectProperty(block, 'ConfigurationPerScreenSize', blocksPropertyBreadcrumb, true, 'object');
        if (block.ConfigurationPerScreenSize) {
            this.validateBlockConfigurationPerScreenSizeProperties(blocksPropertyBreadcrumb, block.ConfigurationPerScreenSize);
        }
        
        // Validate PageConfiguration if exist (Optional)
        this.validateObjectProperty(block, 'PageConfiguration', blocksPropertyBreadcrumb, true, 'object');
        if (block.PageConfiguration) {
            this.validateBlockPageConfigurationProperties(blocksPropertyBreadcrumb, block.PageConfiguration);
        }
    }

    private validateBlockConfigurationProperties(blockPropertyBreadcrumb: string, configuration: ResourceDataConfiguration): void {
        const configurationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> Configuration`;

        // Validate Resource
        this.validateObjectProperty(configuration, 'Resource', configurationPropertyBreadcrumb);
        
        // Validate AddonUUID
        this.validateObjectProperty(configuration, 'AddonUUID', configurationPropertyBreadcrumb);

        // Validate Data
        this.validateObjectProperty(configuration, 'Data', configurationPropertyBreadcrumb, false, 'object');
    }
    
    private validateBlockConfigurationPerScreenSizeProperties(blockPropertyBreadcrumb: string, configuration: ScreenSizeDataConfiguration): void {
        const screenSizeDataConfigurationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> ScreenSizeDataConfiguration`;

        // Validate Tablet
        this.validateObjectProperty(configuration, 'Tablet', screenSizeDataConfigurationPropertyBreadcrumb, true, 'object');
        
        // Validate Mobile
        this.validateObjectProperty(configuration, 'Mobile', screenSizeDataConfigurationPropertyBreadcrumb, true, 'object');
    }
    
    private validatePageConfigurationParameterProperties(pagePropertyBreadcrumb: string, parameter: PageConfigurationParameter, parameterIndex: number) {
        const parameterPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Parameters at index ${parameterIndex}`;

        // Validate Key
        this.validateObjectProperty(parameter, 'Key', parameterPropertyBreadcrumb);

        // Validate Type
        this.validateObjectProperty(parameter, 'Type', parameterPropertyBreadcrumb);

        // Validate Mandatory if exist (Optional)
        this.validateObjectProperty(parameter, 'Mandatory', parameterPropertyBreadcrumb, true, 'boolean');
        
        // Validate Produce if exist (Optional)
        this.validateObjectProperty(parameter, 'Produce', parameterPropertyBreadcrumb, true, 'boolean');

        // Validate Consume if exist (Optional)
        this.validateObjectProperty(parameter, 'Consume', parameterPropertyBreadcrumb, true, 'boolean');

        // If the type is filter check for more fields.
        if (parameter.Type === 'Filter') {
            // Validate Resource
            this.validateObjectProperty(parameter, 'Resource', parameterPropertyBreadcrumb);

            // Validate Fields
            this.validateArrayProperty(parameter, 'Fields', parameterPropertyBreadcrumb, false);
        }
    }

    private validateBlockPageConfigurationProperties(blockPropertyBreadcrumb: string, configuration: PageConfiguration): void {
        const pageConfigurationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> PageConfiguration`;
        
        // Validate Parameters
        this.validateArrayProperty(configuration, 'Parameters', pageConfigurationPropertyBreadcrumb, false);
        for (let index = 0; index < configuration.Parameters?.length; index++) {
            this.validatePageConfigurationParameterProperties(pageConfigurationPropertyBreadcrumb, configuration.Parameters[index], index);
        }
    }

    private validatePageSectionBlockContainerProperties(sectionsPropertyBreadcrumb: string, sectionColumn: PageSectionColumn): void {
        const blockPropertyBreadcrumb = `${sectionsPropertyBreadcrumb} -> BlockContainer`;
        
        // Validate BlockContainer if exist (Optional)
        this.validateObjectProperty(sectionColumn, 'BlockContainer', blockPropertyBreadcrumb, true, 'object');

        if (sectionColumn.BlockContainer) {
            // Validate BlockKey in BlockContainer
            this.validateObjectProperty(sectionColumn.BlockContainer, 'BlockKey', blockPropertyBreadcrumb);

            // Validate Hide in Block if exist (Optional)
            this.validateArrayProperty(sectionColumn.BlockContainer, 'Hide', blockPropertyBreadcrumb, true, DataViewScreenSizes);
        }
    }

    private validatePageParameterProperties(pagePropertyBreadcrumb: string, parameter: any, parameterIndex: number): void {
        const ParametersPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Parameters at index ${parameterIndex}`;

        // Validate Key
        this.validateObjectProperty(parameter, 'Key', ParametersPropertyBreadcrumb);

        // Validate Type if exist
        this.validateObjectProperty(parameter, 'Type', ParametersPropertyBreadcrumb);
        
        // Validate Description if exist (Optional)
        this.validateObjectProperty(parameter, 'Description', ParametersPropertyBreadcrumb, true);

        // Validate DefaultValue if exist (Optional)
        this.validateObjectProperty(parameter, 'DefaultValue', ParametersPropertyBreadcrumb, true);
    }

    private validatePageSectionProperties(pagePropertyBreadcrumb: string, section: PageSection, sectionIndex: number): void {
        const sectionsPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Sections at index ${sectionIndex}`;

        // Validate Key
        this.validateObjectProperty(section, 'Key', sectionsPropertyBreadcrumb);

        // Validate Name if exist (Optional)
        this.validateObjectProperty(section, 'Name', sectionsPropertyBreadcrumb, true);
        
        // Validate Height if exist (Optional)
        this.validateObjectProperty(section, 'Height', sectionsPropertyBreadcrumb, true, 'number');

        // Validate CollapseOnTablet if exist (Optional)
        this.validateObjectProperty(section, 'CollapseOnTablet', sectionsPropertyBreadcrumb, true, 'boolean');

        // Validate FillHeight if exist (Optional)
        this.validateObjectProperty(section, 'FillHeight', sectionsPropertyBreadcrumb, true, 'boolean');

        // Validate Split if exist (Optional)
        if (section.hasOwnProperty('Split')) {
            if (typeof section.Split !== 'string') {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Split', 'string'));
            } else if (section.Split.length > 0 && !SplitTypes.some(st => st == section.Split)) {
                throw new Error(this.getWrongTypeError(sectionsPropertyBreadcrumb, 'Split', `empty or value from [${SplitTypes}]`));
            }
        }
        
        // Validate Columns
        this.validateArrayProperty(section, 'Columns', sectionsPropertyBreadcrumb);
        for (let index = 0; index < section.Columns.length; index++) {
            const column = section.Columns[index];
            this.validatePageSectionBlockContainerProperties(`${sectionsPropertyBreadcrumb} -> Columns at index ${index}`, column);
        }
        
        // Validate Hide if exist (Optional)
        this.validateArrayProperty(section, 'Hide', sectionsPropertyBreadcrumb, true, DataViewScreenSizes);
    }

    private validatePageLayoutProperties(layout: PageLayout, pagePropertyBreadcrumb: string): void {
        const layoutPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Layout`;

        // Validate Sections
        this.validateArrayProperty(layout, 'Sections', layoutPropertyBreadcrumb);
        for (let index = 0; index < layout.Sections.length; index++) {
            this.validatePageSectionProperties(layoutPropertyBreadcrumb, layout.Sections[index], index);
        }

        // Validate SectionsGap if exist (Optional)
        if (layout.hasOwnProperty('SectionsGap')) {
            if (typeof layout.SectionsGap !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'SectionsGap', 'string'));
            } else if (!PageSizeTypes.some(pst => (pst === layout.SectionsGap || 'none'))) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'SectionsGap', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate ColumnsGap if exist (Optional)
        if (layout.hasOwnProperty('ColumnsGap')) {
            if (typeof layout.ColumnsGap !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'ColumnsGap', 'string'));
            } else if (!PageSizeTypes.some(pst => (pst === layout.ColumnsGap || 'none'))) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'ColumnsGap', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate HorizontalSpacing if exist (Optional)
        if (layout.hasOwnProperty('HorizontalSpacing')) {
            if (typeof layout.HorizontalSpacing !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'HorizontalSpacing', 'string'));
            } else if (!PageSizeTypes.some(pst => (pst === layout.HorizontalSpacing || 'none'))) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'HorizontalSpacing', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate VerticalSpacing if exist (Optional)
        if (layout.hasOwnProperty('VerticalSpacing')) {
            if (typeof layout.VerticalSpacing !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'VerticalSpacing', 'string'));
            } else if (!PageSizeTypes.some(pst => (pst === layout.VerticalSpacing || 'none'))) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'VerticalSpacing', `value from [${PageSizeTypes}]`));
            }
        }
        
        // Validate MaxWidth if exist (Optional)
        this.validateObjectProperty(layout, 'MaxWidth', layoutPropertyBreadcrumb, true, 'number');
    }
    
    private addOptionalPropertyIfExist(source: any, target: any, propertyName: string): void {
        if (source.hasOwnProperty(propertyName)) {
            target[propertyName] = source[propertyName];
        }
    }

    private validatePageBlocksData(page: Page, availableBlocks: IBlockLoaderData[]) {
        // Validate blocks.
        const blockKeys = new Map<string, string>();
        for (let index = 0; index < page.Blocks?.length; index++) {
            const block = page.Blocks[index];
            
            // Validate if the block key is not already exist.
            if (!blockKeys.has(block.Key)) {
                blockKeys.set(block.Key, block.Key);
            } else {
                throw new Error(`Block with Key ${block.Key} already exists.`);
            }
            
            // Validate if the block is in the available blocks.
            if (availableBlocks.findIndex(ab => ab.relation.AddonUUID === block.Configuration.AddonUUID) === -1) {
                throw new Error(`Block with AddonUUID ${block.Configuration.AddonUUID} doesn't exist as available page block.`);
            }

            // *** Relation is depricated ***
            // // Validate that Configuration.Resource is the same as Relation.Name
            // if (block.Configuration.Resource !== block.Relation.Name) {
            //     throw new Error(`Block -> Configuration -> Resource should be the same as Block -> Relation -> Name`);
            // }

            // // Validate that Configuration.AddonUUID is the same as Relation.AddonUUID
            // if (block.Configuration.AddonUUID !== block.Relation.AddonUUID) {
            //     throw new Error(`Block -> Configuration -> AddonUUID should be the same as Block -> Relation -> AddonUUID`);
            // }
        }

        const sectionsBlockKeys = new Map<string, string>();

        // Validate blocks in sections.
        for (let sectionIndex = 0; sectionIndex < page.Layout?.Sections?.length; sectionIndex++) {
            const section = page.Layout?.Sections[sectionIndex];

            for (let columnIndex = 0; columnIndex < section?.Columns?.length; columnIndex++) {
                const blockContainer = section?.Columns[columnIndex].BlockContainer;
            
                if (blockContainer) {
                    // Validate if the block key is not already exist.
                    if (!sectionsBlockKeys.has(blockContainer.BlockKey)) {
                        sectionsBlockKeys.set(blockContainer.BlockKey, blockContainer.BlockKey);
                    } else {
                        throw new Error(`Block with Key ${blockContainer.BlockKey} in section index ${sectionIndex} already exists in another section column.`);
                    }

                    // Validate if block key is in the blockKeys map.
                    if (!blockKeys.has(blockContainer.BlockKey)) {
                        throw new Error(`BlockKey ${blockContainer.BlockKey} in section index ${sectionIndex} doesn't exist in Page.Blocks.`);
                    }
                }
            }
        }
    }

    private validatePageConfigurationData(page: Page) {
        // Validate parameters.
        const parameterKeys = new Map<string, PageConfigurationParameter>();
        for (let blockIndex = 0; blockIndex < page.Blocks?.length; blockIndex++) {
            const block = page.Blocks[blockIndex];
            
            if (block?.PageConfiguration) {
                for (let parameterIndex = 0; parameterIndex < block.PageConfiguration.Parameters?.length; parameterIndex++) {
                    const parameter = block.PageConfiguration.Parameters[parameterIndex];
                    const paramKey = parameter.Key;
                    const paramType = parameter.Type;

                    // Validate parameter Type.
                    if (paramType !== 'String') {
                        throw new Error(`Parameter type - ${paramType} is not supported, The supported types are ["String"].`);
                    }

                    // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
                    if (!parameterKeys.has(paramKey)) {
                        parameterKeys.set(paramKey, parameter);
                    } else {
                        if (paramType !== parameterKeys.get(paramKey)?.Type) {
                            throw new Error(`Parameters with key ${paramKey} should be with the same Type.`);
                        }
                    }

                    if (!parameter.Produce && !parameter.Consume) {
                        throw new Error(`The parameter (with key ${paramKey}) is not allowed, at least on of the properties Produce or Consume should be true.`);
                    }
                }
            }
        }
    }

    private getObjectSize(obj: any, sizeType: 'byte' | 'kb' | 'mb' = 'byte') {
        let str = '';
        if (typeof obj === 'string') {
            // If obj is a string, then use it
            str = obj;
        } else {
            // Else, make obj into a string
            str = JSON.stringify(obj);
        }
        
        // Get the length of the Uint8Array
        const bytes = new TextEncoder().encode(str).length;

        if (sizeType === 'byte') {
            return bytes;
        } else {
            const kiloBytes = bytes / 1024;
            
            if (sizeType === 'kb') {
                return kiloBytes;
            } else { // if (sizeType === 'mb') {
                return kiloBytes / 1024;
            }
        }
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/
    
    validatePagesLimitNumber(page: Page, publishedPages: Array<Page>): void {
        const softLimitPagesNumber = PAGES_NUBER_LIMITATION;
        const pageExist = publishedPages.findIndex(p => p.Key === page.Key) >= 0;
        
        if (!pageExist && publishedPages.length >= softLimitPagesNumber) {
            throw new Error(`You exceeded your pages number limit (${softLimitPagesNumber}) - please contact your administrator.`);
        }
    }

    validatePageLimitations(page: Page, pagesVariables: any): void {
        let blocksNumberLimit = pagesVariables[DEFAULT_BLOCKS_NUMBER_LIMITATION.key] || DEFAULT_BLOCKS_NUMBER_LIMITATION.softValue;
        let blocksSizeLimit = pagesVariables[DEFAULT_PAGE_SIZE_LIMITATION.key] || DEFAULT_PAGE_SIZE_LIMITATION.softValue;
        
        // Check the limitations.
        if (page.Blocks?.length >= blocksNumberLimit) {
            throw new Error(`You exceeded your blocks number limit (${blocksNumberLimit}) - please contact your administrator.`);
        }

        const pageSize = this.getObjectSize(page, 'kb');
        if (pageSize >= blocksSizeLimit) {
            throw new Error(`You exceeded your blocks size limit (${blocksSizeLimit}) - please contact your administrator.`);
        }
    }

    // Validate the page and throw error if not valid.
    validatePageProperties(page: Page): void {
        const pagePropertyBreadcrumb = 'Page';
        
        // Validate Key if exist (Optional)
        this.validateObjectProperty(page, 'Key', pagePropertyBreadcrumb, true);

        // Validate Hidden if exist (Optional)
        this.validateObjectProperty(page, 'Hidden', pagePropertyBreadcrumb, true, 'boolean');

        // Validate Name if exist (Optional)
        this.validateObjectProperty(page, 'Name', pagePropertyBreadcrumb, true);
        
        // Validate Description if exist (Optional)
        this.validateObjectProperty(page, 'Description', pagePropertyBreadcrumb, true);
        
        // Validate Parameters
        this.validateArrayProperty(page, 'Parameters', pagePropertyBreadcrumb, true);
        for (let index = 0; index < page.Parameters?.length; index++) {
            this.validatePageParameterProperties(pagePropertyBreadcrumb, page.Parameters[index], index);
        }

        // Validate OnLoadFlow
        this.validateObjectProperty(page, 'OnLoadFlow', pagePropertyBreadcrumb, true, 'object');

        // Validate OnParameterChangeFlow
        this.validateObjectProperty(page, 'OnParameterChangeFlow', pagePropertyBreadcrumb, true, 'object');

        // Validate OnChangeFlow
        this.validateObjectProperty(page, 'OnChangeFlow', pagePropertyBreadcrumb, true, 'object');

        // Validate Blocks
        this.validateArrayProperty(page, 'Blocks', pagePropertyBreadcrumb);
        for (let index = 0; index < page.Blocks.length; index++) {
            this.validatePageBlockProperties(pagePropertyBreadcrumb, page.Blocks[index], index);
        }
        
        // Validate Layout
        this.validateObjectProperty(page, 'Layout', pagePropertyBreadcrumb, false, 'object');
        this.validatePageLayoutProperties(page.Layout, pagePropertyBreadcrumb)
    }

    validatePageData(page: Page, availableBlocks: IBlockLoaderData[]) {
        // Validate page blocks data.
        this.validatePageBlocksData(page, availableBlocks);
        
        // Validate page configuration data.
        this.validatePageConfigurationData(page);
    }
    
    getPageCopyAccordingInterface(page: Page, availableBlocks: IBlockLoaderData[]): Page {
        // Init with the mandatories properties.
        let res: Page = {
            Blocks: [],
            Layout: {
                Sections: []
            }
        };

        this.addOptionalPropertyIfExist(page, res, 'Hidden');
        this.addOptionalPropertyIfExist(page, res, 'CreationDateTime');
        this.addOptionalPropertyIfExist(page, res, 'Key');
        this.addOptionalPropertyIfExist(page, res, 'Name');
        this.addOptionalPropertyIfExist(page, res, 'Description');
        
        // Add Parameters specific properties.
        res.Parameters = [];
    
        for (let paramIndex = 0; paramIndex < page.Parameters?.length; paramIndex++) {
            const currentParam = page.Parameters[paramIndex];
            const paramToAdd: any = {
                Key: currentParam.Key,
                Type: currentParam.Type
            };

            this.addOptionalPropertyIfExist(currentParam, paramToAdd, 'Description');
            this.addOptionalPropertyIfExist(currentParam, paramToAdd, 'DefaultValue');

            res.Parameters.push(paramToAdd);
        }
        
        // Add OnLoadFlow
        this.addOptionalPropertyIfExist(page, res, 'OnLoadFlow');
        
        // Add OnParameterChangeFlow
        this.addOptionalPropertyIfExist(page, res, 'OnParameterChangeFlow');

        // Add OnChangeFlow
        this.addOptionalPropertyIfExist(page, res, 'OnChangeFlow');
        
        // Add Blocks specific properties.
        for (let blockIndex = 0; blockIndex < page.Blocks.length; blockIndex++) {
            const currentBlock = page.Blocks[blockIndex];
            const currentRelation = availableBlocks.find(ab => ab.relation.AddonUUID === currentBlock.Configuration.AddonUUID && ab.relation.Name === currentBlock.Configuration.Resource)?.relation;

            // The relation must exist else throw exception.
            if (currentRelation) {
                const blockToAdd: PageBlock = {
                    Key: currentBlock.Key,
                    // *** Relation is depricated ***
                    // Relation: {
                    //     AddonUUID: currentBlock.Relation?.AddonUUID,
                    //     RelationName: currentRelation.RelationName,
                    //     Type: currentRelation.Type,
                    //     Name: currentRelation.Name,
                    //     SubType: currentRelation.SubType,
                    //     AddonRelativeURL: currentRelation.AddonRelativeURL,
                    //     ModuleName: currentRelation.ModuleName,
                    //     ComponentName: currentRelation.ComponentName
                    // },
                    Configuration: {
                        Resource: currentBlock.Configuration.Resource,
                        AddonUUID: currentBlock.Configuration.AddonUUID,
                        Data: currentBlock.Configuration.Data
                    }
                };
    
                // *** Relation is depricated ***
                // Add Schema to relation (optional)
                // this.addOptionalPropertyIfExist(currentRelation, blockToAdd.Relation, 'Schema');

                this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'ConfigurationPerScreenSize');
                this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'PageConfiguration');
    
                res.Blocks.push(blockToAdd);
            } else {
                throw new Error(`Block with AddonUUID ${currentBlock.Configuration.AddonUUID} doesn't exist as available page block.`);
            }
        } 

        // Add Layout specific properties.
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'SectionsGap');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'ColumnsGap');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'HorizontalSpacing');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'VerticalSpacing');
        this.addOptionalPropertyIfExist(page.Layout, res.Layout, 'MaxWidth');

        // Add Layout sections specific properties.
        for (let sectionIndex = 0; sectionIndex < page.Layout.Sections.length; sectionIndex++) {
            const currentSection = page.Layout.Sections[sectionIndex];
            const sectionToAdd: PageSection = {
                Key: currentSection.Key,
                Columns: [],
            };

            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Name');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Height');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Split');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'Hide');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'CollapseOnTablet');
            this.addOptionalPropertyIfExist(currentSection, sectionToAdd, 'FillHeight');

            // Add Columns -> blocks specific properties.
            for (let columnIndex = 0; columnIndex < currentSection.Columns.length; columnIndex++) {
                const currentColumn = currentSection.Columns[columnIndex];
                const columnToAdd: PageSectionColumn = {};

                if (currentColumn.BlockContainer) {
                    columnToAdd.BlockContainer = {
                        BlockKey: currentColumn.BlockContainer.BlockKey
                    };

                    this.addOptionalPropertyIfExist(currentColumn.BlockContainer, columnToAdd.BlockContainer, 'Hide');
                }

                sectionToAdd.Columns.push(columnToAdd);
            }

            res.Layout.Sections.push(sectionToAdd);
        } 

        return res;
    }
}