import { DataViewScreenSizes, NgComponentRelation, Page, PageBlock, PageLayout, PageSection, PageSectionColumn, PageSizeTypes, SplitTypes, ResourceDataConfiguration, ScreenSizeDataConfiguration, PageConfiguration } from "@pepperi-addons/papi-sdk";
import { IAvailableBlockData } from "./pages.model";

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
                        if (!arrayType.some(atv => atv === value)) {
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

        // Validate Relation
        this.validateObjectProperty(block, 'Relation', blocksPropertyBreadcrumb, false, 'object');
        this.validateBlockRelationProperties(blocksPropertyBreadcrumb, block.Relation);
        
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

    private validateBlockRelationProperties(blockPropertyBreadcrumb: string, relation: NgComponentRelation): void {
        const relationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> Relation`;

        // Validate Name
        this.validateObjectProperty(relation, 'Name', relationPropertyBreadcrumb);
        
        // Validate SubType
        this.validateObjectProperty(relation, 'SubType', relationPropertyBreadcrumb);

        // Validate AddonUUID
        this.validateObjectProperty(relation, 'AddonUUID', relationPropertyBreadcrumb);

        // Validate AddonRelativeURL
        this.validateObjectProperty(relation, 'AddonRelativeURL', relationPropertyBreadcrumb);

        // Validate ModuleName
        this.validateObjectProperty(relation, 'ModuleName', relationPropertyBreadcrumb);

        // Validate ComponentName
        this.validateObjectProperty(relation, 'ComponentName', relationPropertyBreadcrumb);
    }

    private validateBlockConfigurationProperties(blockPropertyBreadcrumb: string, configuration: ResourceDataConfiguration): void {
        const configurationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> Configuration`;

        // Validate Resource
        this.validateObjectProperty(configuration, 'Resource', configurationPropertyBreadcrumb);
        
        // Validate AddonUUID
        this.validateObjectProperty(configuration, 'AddonUUID', configurationPropertyBreadcrumb);

        // Validate Data
        this.validateObjectProperty(configuration, 'Data', configurationPropertyBreadcrumb, true, 'object');
    }
    
    private validateBlockConfigurationPerScreenSizeProperties(blockPropertyBreadcrumb: string, configuration: ScreenSizeDataConfiguration): void {
        const screenSizeDataConfigurationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> ScreenSizeDataConfiguration`;

        // Validate Tablet
        this.validateObjectProperty(configuration, 'Tablet', screenSizeDataConfigurationPropertyBreadcrumb, true, 'object');
        
        // Validate Mobile
        this.validateObjectProperty(configuration, 'Mobile', screenSizeDataConfigurationPropertyBreadcrumb, true, 'object');
    }
    
    private validateBlockPageConfigurationProperties(blockPropertyBreadcrumb: string, configuration: PageConfiguration): void {
        const pageConfigurationPropertyBreadcrumb = `${blockPropertyBreadcrumb} -> PageConfiguration`;
        
        // Validate Parameters
        this.validateArrayProperty(configuration, 'Parameters', pageConfigurationPropertyBreadcrumb, false);
        
        // TODO: Validate PageConfiguration Parameters.
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

    private validatePageSectionProperties(pagePropertyBreadcrumb: string, section: PageSection, sectionIndex: number): void {
        const sectionsPropertyBreadcrumb = `${pagePropertyBreadcrumb} -> Sections at index ${sectionIndex}`;

        // Validate Key
        this.validateObjectProperty(section, 'Key', sectionsPropertyBreadcrumb);

        // Validate Name if exist (Optional)
        this.validateObjectProperty(section, 'Name', sectionsPropertyBreadcrumb, true);
        
        // Validate Height if exist (Optional)
        this.validateObjectProperty(section, 'Height', sectionsPropertyBreadcrumb, true, 'number');

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
            } else if (!PageSizeTypes.some(pst => pst === layout.SectionsGap)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'SectionsGap', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate ColumnsGap if exist (Optional)
        if (layout.hasOwnProperty('ColumnsGap')) {
            if (typeof layout.ColumnsGap !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'ColumnsGap', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.ColumnsGap)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'ColumnsGap', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate HorizontalSpacing if exist (Optional)
        if (layout.hasOwnProperty('HorizontalSpacing')) {
            if (typeof layout.HorizontalSpacing !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'HorizontalSpacing', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.HorizontalSpacing)) {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'HorizontalSpacing', `value from [${PageSizeTypes}]`));
            }
        }

        // Validate VerticalSpacing if exist (Optional)
        if (layout.hasOwnProperty('VerticalSpacing')) {
            if (typeof layout.VerticalSpacing !== 'string') {
                throw new Error(this.getWrongTypeError(layoutPropertyBreadcrumb, 'VerticalSpacing', 'string'));
            } else if (!PageSizeTypes.some(pst => pst === layout.VerticalSpacing)) {
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

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/

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
        
        // Validate Blocks
        this.validateArrayProperty(page, 'Blocks', pagePropertyBreadcrumb);
        for (let index = 0; index < page.Blocks.length; index++) {
            this.validatePageBlockProperties(pagePropertyBreadcrumb, page.Blocks[index], index);
        }
        
        // Validate Layout
        this.validateObjectProperty(page, 'Layout', pagePropertyBreadcrumb, false, 'object');
        this.validatePageLayoutProperties(page.Layout, pagePropertyBreadcrumb)
    }

    validatePageBlocks(page: Page, availableBlocks: IAvailableBlockData[]) {
        // Validate blocks.
        const blockKeys = new Map<string, string>();
        for (let index = 0; index < page.Blocks?.length; index++) {
            const block = page.Blocks[index];
            
            // Validate if the block key is not already exist.
            if (!blockKeys.has(block.Key)) {
                blockKeys.set(block.Key, block.Key);
            } else {
                throw new Error(`Block with Key ${block.Key} is already exist.`);
            }
            
            // Validate if the block is in the available blocks.
            if (availableBlocks.findIndex(ab => ab.relation.AddonUUID === block.Relation?.AddonUUID) === -1) {
                throw new Error(`Block with AddonUUID ${block.Relation.AddonUUID} isn't exist as available page block.`);
            }

            // Validate that Configuration.Resource is the same as Relation.Name
            if (block.Configuration.Resource !== block.Relation.Name) {
                throw new Error(`Block -> Configuration -> Resource should be the same as Block -> Relation -> Name`);
            }

            // Validate that Configuration.AddonUUID is the same as Relation.AddonUUID
            if (block.Configuration.AddonUUID !== block.Relation.AddonUUID) {
                throw new Error(`Block -> Configuration -> AddonUUID should be the same as Block -> Relation -> AddonUUID`);
            }
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
                        throw new Error(`Block with Key ${blockContainer.BlockKey} in section index ${sectionIndex} is already exist in another section column.`);
                    }

                    // Validate if block key is in the blockKeys map.
                    if (!blockKeys.has(blockContainer.BlockKey)) {
                        throw new Error(`BlockKey ${blockContainer.BlockKey} in section index ${sectionIndex} isn't exist in Page.Blocks.`);
                    }
                }
            }
        }
    }

    getPageCopyAccordingInterface(page: Page): Page {
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
        
        // Add Blocks specific properties.
        for (let blockIndex = 0; blockIndex < page.Blocks.length; blockIndex++) {
            const currentBlock = page.Blocks[blockIndex];
            const blockToAdd: PageBlock = {
                Key: currentBlock.Key,
                Relation: {
                    RelationName: currentBlock.Relation.RelationName,
                    Type: currentBlock.Relation.Type,
                    Name: currentBlock.Relation.Name,
                    AddonUUID: currentBlock.Relation.AddonUUID,
                    SubType: currentBlock.Relation.SubType,
                    AddonRelativeURL: currentBlock.Relation.AddonRelativeURL,
                    ModuleName: currentBlock.Relation.ModuleName,
                    ComponentName: currentBlock.Relation.ComponentName
                },
                Configuration: {
                    Resource: currentBlock.Configuration.Resource,
                    AddonUUID: currentBlock.Configuration.AddonUUID,
                    Data: currentBlock.Configuration.Data
                }
            };

            this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'ConfigurationPerScreenSize');
            this.addOptionalPropertyIfExist(currentBlock, blockToAdd, 'PageConfiguration');

            res.Blocks.push(blockToAdd);
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