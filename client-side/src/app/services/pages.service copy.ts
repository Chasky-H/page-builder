// import { CdkDragDrop, CdkDragEnd, CdkDragStart, copyArrayItem, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
// import { Injectable } from "@angular/core";
// import { Params } from "@angular/router";
// import { TranslateService } from "@ngx-translate/core";
// import { PepAddonService, PepGuid, PepHttpService, PepScreenSizeType, PepSessionService, PepUtilitiesService } from "@pepperi-addons/ngx-lib";
// import { PepRemoteLoaderOptions, PepRemoteLoaderService } from "@pepperi-addons/ngx-lib/remote-loader";
// import { IPepDraggableItem } from "@pepperi-addons/ngx-lib/draggable-items";
// import { Page, PageBlock, NgComponentRelation, PageSection, PageSizeType, SplitType, PageSectionColumn, DataViewScreenSize,ResourceType, 
//     PageConfigurationParameterFilter, PageConfiguration, PageConfigurationParameterBase, PageConfigurationParameter } from "@pepperi-addons/papi-sdk";
// import { PageRowProjection, IPageBuilderData, IBlockLoaderData, IPageClientEventResult, CLIENT_ACTION_ON_CLIENT_PAGE_LOAD, IAvailableBlockData, CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE, PageBlockView, IPageView } from 'shared';
// import { Observable, BehaviorSubject } from 'rxjs';
// import { NavigationService } from "./navigation.service";
// import { distinctUntilChanged, filter } from 'rxjs/operators';
// import { UtilitiesService } from "./utilities.service";
// import * as _ from 'lodash';
// import { coerceNumberProperty } from "@angular/cdk/coercion";
// import { PepSnackBarData, PepSnackBarService } from "@pepperi-addons/ngx-lib/snack-bar";

// export type UiPageSizeType = PageSizeType | 'none';

// export type PageRowStatusType = 'draft' | 'published';

// export type EditorType = 'page-builder' | 'section' | 'block';
// export interface IEditor {
//     id: string,
//     title: string,
//     type: EditorType,
//     remoteModuleOptions?: PepRemoteLoaderOptions,
//     hostObject?: any
// }

// export interface IPageEditor {
//     id: string,
//     pageName: string,
//     pageDescription: string,
//     maxWidth: number,
//     horizontalSpacing?: UiPageSizeType,
//     verticalSpacing?: UiPageSizeType,
//     sectionsGap?: UiPageSizeType,
//     columnsGap?: UiPageSizeType,
//     roundedCorners?: UiPageSizeType,
// }

// export interface ISectionEditor {
//     id: string,
//     sectionName: string,
//     split: SplitType,
//     height: number,
//     fillHeight: boolean
// }

// export interface IBlockEditor {
//     id: string,
//     configuration?: any,
// }

// export interface IBlockProgress {
//     block: PageBlockView;
//     loaded: boolean;
//     openEditorOnLoaded: boolean,
//     priority: number;
// }

// interface IProducerFilterData {
//     FieldType: string;
//     ApiName: string
//     Operation: string
//     Values: string[]
// }

// interface IProducerFilter {
//     // key: string;
//     resource: ResourceType;
//     filter: IProducerFilterData;
// }

// interface IProducerParameters {
//     // key is the block key, value is string | IProduceFilter[]
//     producerParametersMap: Map<string, string | IProducerFilter[]>;
// }

// export interface IPageBlockHostObject {
//     configuration: any;
//     configurationSource?: any;
//     pageConfiguration?: PageConfiguration;
//     pageParameters?: any;
//     parameters?: any;
// }

// interface IMappingResource {
//     ResourceApiNames: string[];
//     SearchIn: string[]
// }

// @Injectable(
// //     {
// //     providedIn: 'root',
// // }
// )
// export class PagesService {
//     private readonly CONSUMERS_PRIORITY = 1;
//     private readonly PRODUCERS_AND_CONSUMERS_PRIORITY = 2;
//     private readonly PRODUCERS_PRIORITY = 3;
//     private readonly SYSTEM_PARAMETER_KEY = 'SystemParameter';

//     readonly BLOCKS_NUMBER_LIMITATION_OBJECT = {
//         key: 'BLOCKS_NUMBER_LIMITATION',
//         value: 15
//     }

//     readonly PAGE_SIZE_LIMITATION_OBJECT = {
//         key: 'PAGE_SIZE_LIMITATION',
//         value: 150
//     }

//     private _defaultSectionTitle = '';
//     set defaultSectionTitle(value: string) {
//         if (this._defaultSectionTitle === '') {
//             this._defaultSectionTitle = value;
//         }
//     }

//     private _editorsBreadCrumb = Array<IEditor>();

//     // This subject is for the screen size change events.
//     private _screenSizeSubject: BehaviorSubject<PepScreenSizeType> = new BehaviorSubject<PepScreenSizeType>(PepScreenSizeType.XL);
//     get screenSizeChange$(): Observable<PepScreenSizeType> {
//         return this._screenSizeSubject.asObservable().pipe(distinctUntilChanged());
//     }

//     // This subject is for demostrate the container size (Usage only in edit mode).
//     private _screenWidthSubject: BehaviorSubject<string> = new BehaviorSubject<string>('100%');
//     get screenWidthChange$(): Observable<string> {
//         return this._screenWidthSubject.asObservable().pipe(distinctUntilChanged());
//     }

//     // This subject is for load the current editor (Usage only in edit mode).
//     private _editorSubject: BehaviorSubject<IEditor> = new BehaviorSubject<IEditor>(null);
//     get editorChange$(): Observable<IEditor> {
//         return this._editorSubject.asObservable().pipe(distinctUntilChanged());
//     }

//     // This subject is for load available blocks on the main editor (Usage only in edit mode).
//     // private _availableBlocksSubject: BehaviorSubject<NgComponentRelation[]> = new BehaviorSubject<NgComponentRelation[]>([]);
//     // get availableBlocksLoadedSubject$(): Observable<NgComponentRelation[]> {
//     //     return this._availableBlocksSubject.asObservable().pipe(distinctUntilChanged());
//     // }

//     // This subject is for load available blocks data on the main editor (Usage only in edit mode).
//     private _availableBlocksDataSubject: BehaviorSubject<IAvailableBlockData[]> = new BehaviorSubject<IAvailableBlockData[]>([]);
//     get availableBlocksDataLoadedSubject$(): Observable<IAvailableBlockData[]> {
//         return this._availableBlocksDataSubject.asObservable().pipe(distinctUntilChanged());
//     }

//     // For load the blocks
//     private _blocksRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();
//     // For load the blocks editors
//     private _blocksEditorsRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();

//     // This is the sections subject (a pare from the page object)
//     private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
//     get sectionsChange$(): Observable<PageSection[]> {
//         return this._sectionsSubject.asObservable();
//     }

//     // This subjects is for load the page blocks into map for better performance and order them by priorities.
//     private _pageBlockProgressMap = new Map<string, IBlockProgress>();
//     get pageBlockProgressMap(): ReadonlyMap<string, IBlockProgress> {
//         return this._pageBlockProgressMap;
//     }
//     private _pageBlockProgressMapSubject = new BehaviorSubject<ReadonlyMap<string, IBlockProgress>>(this.pageBlockProgressMap);
//     get pageBlockProgressMapChange$(): Observable<ReadonlyMap<string, IBlockProgress>> {
//         return this._pageBlockProgressMapSubject.asObservable();
//     }

//     // This is for the current stage of the priority to know what to load in each step.
//     private _currentBlocksPriority: number = this.CONSUMERS_PRIORITY;
//     get currentBlocksPriority() {
//         return this._currentBlocksPriority;
//     }

//     // This subject is for page block change.
//     private _pageBlockSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
//     get pageBlockChange$(): Observable<string> {
//         return this._pageBlockSubject.asObservable();
//     }

//     // This is for know if the user made changes in the draft page and not save it yet.
//     private _pageAfterLastSave = null;

//     // This subject is for page change.
//     private _pageSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
//     // get pageLoad$(): Observable<Page> {
//     //     return this._pageSubject.asObservable().pipe(distinctUntilChanged((prevPage, nextPage) => prevPage?.Key === nextPage?.Key));
//     // }
//     get pageDataChange$(): Observable<Page> {
//         return this._pageSubject.asObservable().pipe(filter(page => !!page));
//     }

//     // This subject is for page view change.
//     private _pageViewSubject: BehaviorSubject<IPageView> = new BehaviorSubject<IPageView>(null);
//     get pageViewLoad$(): Observable<IPageView> {
//         return this._pageViewSubject.asObservable().pipe(distinctUntilChanged((prevPage, nextPage) => prevPage?.Key === nextPage?.Key));
//     }
//     get pageViewDataChange$(): Observable<IPageView> {
//         return this._pageViewSubject.asObservable().pipe(filter(page => !!page));
//     }


//     private _pageParameters: BehaviorSubject<any> = new BehaviorSubject<any>({});
//     get pageParametersChange$(): Observable<any> {
//         return this._pageParameters.asObservable().pipe(distinctUntilChanged());
//     }

//     // This map is for producers parameters by parameter key.
//     // private _producerParameterKeysMap = new Map<string, IProducerParameters>();

//     // This subject is for consumers parameters change.
//     // private _consumerParametersMapSubject = new BehaviorSubject<Map<string, any>>(null);
//     // get consumerParametersMapChange$(): Observable<ReadonlyMap<string, any>> {
//     //     return this._consumerParametersMapSubject.asObservable().pipe(distinctUntilChanged());
//     // }

//     private _mappingsResourcesFields = new Map<string, IMappingResource>();

//     // This subject is for edit mode when block is dragging now or not.
//     private _draggingBlockKey: BehaviorSubject<string> = new BehaviorSubject('');
//     get draggingBlockKey(): Observable<string> {
//         return this._draggingBlockKey.asObservable().pipe(distinctUntilChanged());
//     }

//     // This subject is for edit mode when section is dragging now or not.
//     private _draggingSectionKey: BehaviorSubject<string> = new BehaviorSubject('');
//     get draggingSectionKey(): Observable<string> {
//         return this._draggingSectionKey.asObservable().pipe(distinctUntilChanged());
//     }

//     // This subject is for lock or unlock the screen (Usage only in edit mode).
//     private _lockScreenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
//     get lockScreenChange$(): Observable<boolean> {
//         return this._lockScreenSubject.asObservable().pipe(distinctUntilChanged());
//     }

//     // Indicates if the pages should run on offline mode.
//     public isOffline: boolean = false;

//     constructor(
//         private utilitiesService: UtilitiesService,
//         private pepUtilitiesService: PepUtilitiesService,
//         private pepSnackBarService: PepSnackBarService,
//         private translate: TranslateService,
//         private sessionService: PepSessionService,
//         private httpService: PepHttpService,
//         private remoteLoaderService: PepRemoteLoaderService,
//         private navigationService: NavigationService,
//         private addonService: PepAddonService
//     ) {
//         this.pageViewLoad$.subscribe((pageView: IPageView) => {
//             this.loadDefaultEditor(pageView);
//             this.notifySectionsChange(pageView?.Layout.Sections ?? [], false);
//             this.loadBlocks(pageView);
//         });

//         this.pageBlockProgressMapChange$.subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
//             // let needToRebuildFilters = false;

//             // // Check that all pageProducersFiltersMap blocks keys exist in blocksProgress (if some block is removed we need to clear his filter).
//             // this._producerParameterKeysMap.forEach((value: IProducerParameters, parameterKey: string) => {
//             //     value?.producerParametersMap.forEach((parameterValue: any, producerBlockKey: string) => {
//             //         // If the producer block key is not system and not exist in the blocks progress.
//             //         if (producerBlockKey !== this.SYSTEM_PARAMETER_KEY && !blocksProgress.has(producerBlockKey)) {
//             //             // Delete the producer data in the current parameter.
//             //             value.producerParametersMap.delete(producerBlockKey);
//             //             needToRebuildFilters = true;
//             //         }
//             //     });
//             // });

//             // if (needToRebuildFilters) {
//             //     this.buildConsumersParameters();
//             // }
//         });
//     }

//     private loadBlocks(pageView: IPageView) {
//         if (pageView) {
//             // Some logic to load the blocks by priority (first none or Produce only, second Consume & Produce, third Consume only).
//             if (pageView.Blocks) {
//                 pageView.Blocks.forEach(block => {
//                     const isUIBlock = this.doesBlockExistInUI(block.Key);

//                     if (isUIBlock) {
//                         const bp = this.addBlockProgress(block);

//                         // If the currentBlocksPriority is smaller then bp.priority set the bp.priority as the current.
//                         if (this.currentBlocksPriority < bp.priority) {
//                             // Set the current priority to start load all blocks by the current priority.
//                             this._currentBlocksPriority = bp.priority;
//                         }
//                     } else {
//                         // If this block is not declared on any section (not UI block) do nothing.
//                     }
//                 });

//                 this.notifyBlockProgressMapChange();
//             }
//         }
//     }

//     // private getBlockPriority(block: PageBlock): number {
//     //     // first none or Produce only, second Consume & Produce, third Consume only
//     //     let priority = this.PRODUCERS_PRIORITY;

//     //     if (block.PageConfiguration?.Parameters.length > 0) {
//     //         const isConsumeFilters = block.PageConfiguration.Parameters.some(param => param.Consume);
//     //         const isProduceFilters = block.PageConfiguration.Parameters.some(param => param.Produce);

//     //         if (isConsumeFilters) {
//     //             if (isProduceFilters) {
//     //                 priority = this.PRODUCERS_AND_CONSUMERS_PRIORITY;
//     //             } else {
//     //                 priority = this.CONSUMERS_PRIORITY;
//     //             }
//     //         }
//     //     }

//     //     return priority;
//     // }

//     private setBlockAsLoadedAndCalculateCurrentPriority(blockKey: string) {
//         const bpToUpdate = this._pageBlockProgressMap.get(blockKey);

//         if (bpToUpdate && !bpToUpdate.loaded) {
//             // Load editor only for the first time if openEditorOnLoaded is true.
//             if (bpToUpdate.openEditorOnLoaded) {
//                 // setTimeout 0 for navigate on the UI thread.
//                 setTimeout(() => {
//                     this.navigateToEditor('block', bpToUpdate.block.Key);

//                     // unlock the screen.
//                     this._lockScreenSubject.next(false);
//                 }, 0);
//             }

//             bpToUpdate.loaded = true;

//             let allBlocksWithSamePriorityLoaded = true;

//             this._pageBlockProgressMap.forEach(bp => {
//                 if (bp.priority === this.currentBlocksPriority && !bp.loaded) {
//                     allBlocksWithSamePriorityLoaded = false;
//                 }
//             });

//             // Only if all blocks from the same priority are loaded then move on to the next priority.
//             if (allBlocksWithSamePriorityLoaded) {
//                 // Start from the lowest priority and change to the higest priority if exist
//                 let nextPriority = this.CONSUMERS_PRIORITY;

//                 // Find the next priority to load.
//                 this._pageBlockProgressMap.forEach(bp => {
//                     if (!bp.loaded && bp.priority > nextPriority) {
//                         nextPriority = bp.priority;
//                     }
//                 });

//                 // Set the next priority.
//                 if (this._currentBlocksPriority != nextPriority) {
//                     this._currentBlocksPriority = nextPriority;

//                     // Note: The parameters already return from the CPI side so we don't need to buildConsumersParameters
//                 }
//             }

//             this.notifyBlockProgressMapChange();
//         }
//     }

//     // Check if the block key exist in layout -> sections -> columns (if shows in the UI).
//     private doesBlockExistInUI(blockKey: string) {
//         const page = this._pageSubject.getValue();

//         for (let sectionIndex = 0; sectionIndex < page.Layout.Sections.length; sectionIndex++) {
//             const section = page.Layout.Sections[sectionIndex];

//             for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
//                 const column = section.Columns[columnIndex];

//                 if (column.BlockContainer?.BlockKey === blockKey) {
//                     return true;
//                 }
//             }
//         }

//         return false;
//     }

//     private addBlockProgress(blockView: PageBlockView, openEditorOnLoaded: boolean = false): IBlockProgress {
//         const priority = 1; // this.getBlockPriority(block); Not in use anymore this step happens in the CPI level

//         // Create block progress and add it to the map.
//         const initialProgress: IBlockProgress = {
//             loaded: false,
//             openEditorOnLoaded,
//             priority,
//             block: blockView
//         };

//         this._pageBlockProgressMap.set(blockView.Key, initialProgress);

//         return initialProgress;
//     }

//     private getPageViewBlock(block: PageBlock): PageBlockView {
//         const blockView: PageBlockView = {
//             Key: block.Key,
//             RelationData: { 
//                 Name: block.Configuration.Resource,
//                 AddonUUID: block.Configuration.AddonUUID
//             },
//             Configuration: block.Configuration,
//             ConfigurationPerScreenSize: block.ConfigurationPerScreenSize
//         };

//         return blockView;
//     }

//     private addPageBlock(block: PageBlock, openEditorOnLoaded: boolean) {
//         // Add the block to the page blocks.
//         const page = this._pageSubject.getValue();
//         page.Blocks.push(block);
        
//         const blockView: PageBlockView = this.getPageViewBlock(block);

//         // Add the block progress.
//         this.addBlockProgress(blockView, openEditorOnLoaded);
//         this.notifyBlockProgressMapChange();

//         // TODO: Raise load event ???
//         this.notifyPageChange(page);
//     }

//     private removePageBlock(blockId: string) {
//         const page = this._pageSubject.getValue();
//         const index = page.Blocks.findIndex(block => block.Key === blockId);

//         if (index > -1) {
//             page.Blocks.splice(index, 1);
//             this.notifyPageChange(page);
//         }
//     }

//     private removePageBlocks(blockIds: string[]) {
//         if (blockIds.length > 0) {
//             blockIds.forEach(blockId => {
//                 // Remove the block from the page blocks.
//                 this.removePageBlock(blockId)

//                 // Remove the block progress from the map.
//                 if (this._pageBlockProgressMap.has(blockId)) {
//                     this._pageBlockProgressMap.delete(blockId);
//                 }
//             });

//             this.notifyBlockProgressMapChange();
//         }
//     }

//     private removeAllBlocks() {
//         const page = this._pageSubject.getValue();

//         if (page) {
//             page.Blocks = [];
//             this.notifyPageChange(page);
//         }

//         this._pageBlockProgressMap.clear();
//         this.notifyBlockProgressMapChange();
//     }
    
//     private notifyPageChange(page: Page, setLastSavedPage = false) {
//         this._pageSubject.next(page);
        
//         if (setLastSavedPage) {
//             this._pageAfterLastSave = page ?JSON.parse(JSON.stringify(page)) : null;
//         }

//         // Update the page view.
//         const pageView: IPageView = {
//             ...page,
//             Key: page.Key,
//             Blocks: page.Blocks.map(block => { return this.getPageViewBlock(block) })
//         }

//         this.notifyPageViewChange(pageView);
//     }

//     private notifyPageViewChange(pageView: IPageView) {
//         this._pageViewSubject.next(pageView);
//     }

//     private notifySectionsChange(sections: PageSection[], raiseLoadEvent: boolean) {
//         const page = this._pageSubject.getValue();

//         if (page) {
//             page.Layout.Sections = sections;

//             // TODO: Raise load event???

//             this._sectionsSubject.next(page.Layout.Sections);
//             this.notifyPageChange(page);
//         }
//     }

//     private notifyBlockChange(block: PageBlock) {
//         // The blocks are saved by value (in some of the cases) so we need to update the block property and notify that page is change (existing block in blocks).
//         this._pageBlockSubject.next(block.Key);
        
//         const page = this._pageSubject.getValue();
        
//         for (let blockIndex = 0; blockIndex < page.Blocks.length; blockIndex++) {
//             // If this is the block, set it.
//             if (page.Blocks[blockIndex].Key === block.Key) {
//                 page.Blocks[blockIndex] = block;
//                 break;
//             }
//         }
        
//         this.notifyPageChange(page);
        
//         // After update the page that updates the PageView we gonna update the map blocks
//         const bpToUpdate = this._pageBlockProgressMap.get(block.Key);
//         bpToUpdate.block = this.getPageViewBlock(block); 
//         this.notifyBlockProgressMapChange();

//         // TODO: Load this block data from the CPI (editor event only)
//     }

//     private notifyEditorChange(editor: IEditor) {
//         this._editorSubject.next(editor);
//     }

//     private notifyBlockProgressMapChange() {
//         this._pageBlockProgressMapSubject.next(this.pageBlockProgressMap);
//     }

//     private loadDefaultEditor(pageView: IPageView) {
//         this._editorsBreadCrumb = new Array<IEditor>();

//         if (pageView) {
//             const pageEditor: IPageEditor = {
//                 id: pageView?.Key,
//                 pageName: pageView?.Name,
//                 pageDescription: pageView?.Description,
//                 maxWidth: pageView?.Layout.MaxWidth,
//                 verticalSpacing: pageView?.Layout.VerticalSpacing,
//                 horizontalSpacing: pageView?.Layout.HorizontalSpacing,
//                 sectionsGap: pageView?.Layout.SectionsGap,
//                 columnsGap: pageView?.Layout.ColumnsGap,
//                 // roundedCorners: page?.Layout.
//             };

//             this._editorsBreadCrumb.push({
//                 id: 'main',
//                 type : 'page-builder',
//                 title: pageView?.Name,
//                 hostObject: pageEditor
//             });

//             this.notifyEditorChange(this._editorsBreadCrumb[0]);
//         } else {
//             this.notifyEditorChange(null);
//         }
//     }

//     private changeCurrentEditor() {
//         if (this._editorsBreadCrumb.length > 0) {
//             this.notifyEditorChange(this._editorsBreadCrumb[this._editorsBreadCrumb.length - 1]);
//         }
//     }

//     private getEditor(editorType: EditorType, id: string): IEditor {
//         // Build editor object.
//         let editor: IEditor = null;

//         if (editorType === 'section') {
//             editor = this.getSectionEditor(id);
//         } else if (editorType === 'block') {
//             editor = this.getBlockEditor(id);
//         }

//         return editor;
//     }

//     private getMergedConfigurationData(block: PageBlock, configurationSource = false): any {
//         // Copy the object data.
//         let configurationData = JSON.parse(JSON.stringify(block.Configuration.Data));
//         const currentScreenType = this.getScreenType(this._screenSizeSubject.getValue());

//         // Get the configuration data by the current screen size (if exist then merge it up to Tablet and up to Landscape).
//         if (currentScreenType !== 'Landscape' && block.ConfigurationPerScreenSize) {
//             if (configurationSource) {
//                 if (currentScreenType === 'Phablet') {
//                     configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);
//                 }
//             } else {
//                 // Merge from Tablet
//                 configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);

//                 // If currentScreenType === 'Phablet' merge from mobile
//                 if (currentScreenType === 'Phablet') {
//                     configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Mobile);
//                 }
//             }
//         }

//         return configurationData;
//     }

//     private getCommonHostObject(block: PageBlock, addConfigurationSource = false): IPageBlockHostObject {

//         let hostObject: IPageBlockHostObject = {
//             configuration: this.getMergedConfigurationData(block)
//         };

//         // To let the block editor the option to know if to show reset (used for ConfigurationPerScreenSize).
//         // with this property the editor can show the reset button if configuration property isn't equal to configurationSource property.
//         if (addConfigurationSource) {
//             let configurationSource = this.getMergedConfigurationData(block, true)
//             hostObject.configurationSource = configurationSource;
//         }

//         // Add pageConfiguration if exist.
//         if (block.PageConfiguration) {
//             hostObject.pageConfiguration = block.PageConfiguration;
//         }

//         hostObject.pageParameters = this._pageParameters.getValue();

//         return hostObject;
//     }

//     private getSectionEditorTitle(section: PageSection, sectionIndex: number): string {
//         return section.Name || `${this._defaultSectionTitle} ${sectionIndex + 1}`;
//     }

//     private getSectionEditor(sectionId: string): IEditor {
//         // Get the current block.
//         const sections = this._sectionsSubject.getValue();
//         const sectionIndex = sections.findIndex(section => section.Key === sectionId);

//         if (sectionIndex >= 0) {
//             let section = sections[sectionIndex];
//             const sectionEditor: ISectionEditor = {
//                 id: section.Key,
//                 sectionName: section.Name || '',
//                 split: section.Split || undefined,
//                 height: section.Height || 0,
//                 fillHeight: section.FillHeight ?? false
//             }

//             return {
//                 id: sectionId,
//                 type: 'section',
//                 title: this.getSectionEditorTitle(section, sectionIndex),
//                 hostObject: sectionEditor
//             }
//         } else {
//             return null;
//         }
//     }

//     private getSectionColumnById(sectionColumnId: string): PageSectionColumn {
//         let currentColumn = null;

//         // Get the section and column array by the pattern of the section column key.
//         const sectionColumnPatternSeparator = this.getSectionColumnKey();
//         const sectionColumnArr = sectionColumnId.split(sectionColumnPatternSeparator);

//         if (sectionColumnArr.length === 2) {
//             const sections = this._sectionsSubject.getValue();

//             // Get the section id to get the section index.
//             const sectionId = sectionColumnArr[0];
//             const sectionIndex = sections.findIndex(section => section.Key === sectionId);
//             // Get the column index.
//             const columnIndex = coerceNumberProperty(sectionColumnArr[1], -1);
//             if (sectionIndex >= 0 && columnIndex >= 0) {
//                 currentColumn = sections[sectionIndex].Columns[columnIndex];
//             }
//         }

//         return currentColumn;
//     }

//     private getRemoteLoaderOptions(data: IAvailableBlockData, editor = false): PepRemoteLoaderOptions {
//         const remoteLoaderOptions: PepRemoteLoaderOptions = {
//             type: 'module',
//             remoteEntry: data.PageRemoteLoaderOptions.RemoteEntry,
//             // remoteName: '', // For script type, this is the name of the script.
//             exposedModule: `./${data.PageRemoteLoaderOptions.ModuleName}`,
//             elementName: editor ? data.PageRemoteLoaderOptions.EditorElementName : data.PageRemoteLoaderOptions.ElementName,
//             addonId: data.RelationAddonUUID, // For local use (adding the relative path to the assets).
//         };

//         return remoteLoaderOptions;
//     }

//     private getBaseUrl(addonUUID: string): string {
//         // if (this.isOffline){
//         //     return "http://localhost:8088/addon/api/50062e0c-9967-4ed4-9102-f2bc50602d41/addon-cpi";
//         // } else {
//              // For devServer run server on localhost.
//             if(this.navigationService.devServer) {
//                 return `http://localhost:4500/internal_api`;
//             } else {
//                 const baseUrl = this.sessionService.getPapiBaseUrl();
//                 return `${baseUrl}/addons/api/${addonUUID}/internal_api`;
//             }
//         // }
//     }

//     private setPagesVariables(pagesVariables: any) {
//         Object.keys(pagesVariables).forEach(key => {
//             const valueAsNumber = Number(pagesVariables[key]);

//             if (!isNaN(valueAsNumber)) {
//                 if (key === this.BLOCKS_NUMBER_LIMITATION_OBJECT.key) {
//                     this.BLOCKS_NUMBER_LIMITATION_OBJECT.value = valueAsNumber;
//                 } else if (key === this.PAGE_SIZE_LIMITATION_OBJECT.key) {
//                     this.PAGE_SIZE_LIMITATION_OBJECT.value = valueAsNumber;
//                 }
//             }
//         })
//     }

//     private loadBlocksRemoteLoaderOptionsMap(availableBlocksData: IAvailableBlockData[]) {
//         this._blocksRemoteLoaderOptionsMap.clear();

//         availableBlocksData.forEach(data => {
//             const key = this.getRemoteLoaderMapKey(data.RelationName, data.RelationAddonUUID);
//             this._blocksRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(data));
//         });
//     }

//     private loadBlocksEditorsRemoteLoaderOptionsMap(availableBlocksData: IAvailableBlockData[]) {
//         this._blocksEditorsRemoteLoaderOptionsMap.clear();

//         availableBlocksData.forEach(data => {
//             availableBlocksData.forEach(data => {
//                 const key = this.getRemoteLoaderMapKey(data.RelationName, data.RelationAddonUUID);
//                 this._blocksRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(data, true));
//             });
//         });
//     }

//     private getRemoteLoaderMapKey(relationName: string, addonUUID: string): string {
//         return `${relationName}_${addonUUID}`;
//     }

//     // Update the block configuration data by the propertyNamePath and set the field value (deep set).
//     private updateConfigurationDataFieldValue(block: PageBlock, propertyNamePath: string, fieldValue: any) {
//         this.setObjectPropertyValue(block.Configuration.Data, propertyNamePath, fieldValue);
//     }

//     // Update the block configuration per screen size according the current screen sizes and the saved values (deep set).
//     private updateConfigurationPerScreenSizeFieldValue(block: PageBlock, propertyNamePath: string, fieldValue: any, currentScreenType: DataViewScreenSize) {
//         if (block.ConfigurationPerScreenSize === undefined) {
//             block.ConfigurationPerScreenSize = {};
//         }

//         let objectToUpdate;
//         if (currentScreenType === 'Tablet') {
//             if (block.ConfigurationPerScreenSize.Tablet === undefined) {
//                 block.ConfigurationPerScreenSize.Tablet = {};
//             }

//             objectToUpdate = block.ConfigurationPerScreenSize.Tablet;
//         } else { // Phablet
//             if (block.ConfigurationPerScreenSize.Mobile === undefined) {
//                 block.ConfigurationPerScreenSize.Mobile = {};
//             }

//             objectToUpdate = block.ConfigurationPerScreenSize.Mobile;
//         }

//         // Update the block configuration data by the propertyNamePath and set the field value.
//         this.setObjectPropertyValue(objectToUpdate, propertyNamePath, fieldValue);
//     }

//     // Set the object field value by propertyNamePath (deep set).
//     private setObjectPropertyValue(object: any, propertyNamePath: string, value: any): void {
//         if (value !== undefined) {
//             _.set(object, propertyNamePath, value);
//         } else {
//             _.unset(object, propertyNamePath);
//         }
//     }

//     private searchFieldInSchemaFields(schemaFields: any, propertiesHierarchy: Array<string>): boolean {
//         let canConfigurePerScreenSize = false;

//         if (propertiesHierarchy.length > 0) {
//             const startArrayCharIndex = propertiesHierarchy[0].indexOf('[');

//             // If it's array then cut the index from the key else use the whole key.
//             const currentFieldKey = (startArrayCharIndex === -1) ? propertiesHierarchy[0] : propertiesHierarchy[0].substring(0, startArrayCharIndex);
//             const schemaField = schemaFields[currentFieldKey];

//             if (schemaField) {
//                 const isObject = schemaField.Type === 'Object';
//                 const isArray = schemaField.Type === 'Array';

//                 // If it's object || array
//                 if (isObject || isArray) {
//                     // If the field index is the last
//                     if (propertiesHierarchy.length === 1) {
//                         if (schemaField.ConfigurationPerScreenSize === true) {
//                             canConfigurePerScreenSize = true;
//                         }
//                     } else { // Check in deepPropertyName (fields || items).
//                         const fieldsObject = (isArray ? schemaField.Items?.Fields : schemaField.Fields) || null;

//                         if (fieldsObject) {
//                             propertiesHierarchy.shift(); // Remove the first element.
//                             canConfigurePerScreenSize = this.searchFieldInSchemaFields(fieldsObject, propertiesHierarchy);
//                         }
//                     }
//                 } else {
//                     if (propertiesHierarchy.length === 1) {
//                         // We don't support resource.
//                         if (schemaField.Type !== 'Resource') {
//                             if (schemaField.ConfigurationPerScreenSize === true) {
//                                 canConfigurePerScreenSize = true;
//                             }
//                         }
//                     }
//                 }
//             }
//         }

//         return canConfigurePerScreenSize;
//     }

//     private validatePageConfigurationParametersOnCurrentBlock(parameterKeys: Map<string, PageConfigurationParameter>, parameter: PageConfigurationParameter) {
//         // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
//         if (!parameterKeys.has(parameter.Key)) {
//             parameterKeys.set(parameter.Key, parameter);
//         } else {
//             if (parameter.Type !== parameterKeys.get(parameter.Key)?.Type) {
//                 const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.TYPE_IS_DIFFERENT_FOR_THIS_KEY', { parameterKey: parameter.Key});
//                 throw new Error(msg);
//             }
//         }

//         if (!parameter.Produce && !parameter.Consume) {
//             const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.CONSUME_AND_PRODUCE_ARE_FALSE', { parameterKey: parameter.Key});
//             throw new Error(msg);
//         }
//     }

//     private validatePageConfigurationParametersOnPageBlocks(blockParameterKeys: Map<string, { block: PageBlock, parameter: PageConfigurationParameter }[]>, parameter: PageConfigurationParameter) {
//         // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
//         if (blockParameterKeys.has(parameter.Key)) {
//             const blockParameter = blockParameterKeys.get(parameter.Key)[0];

//             if (parameter.Type !== blockParameter?.parameter?.Type) {
//                 const sections = this._sectionsSubject.getValue();

//                 // Find section and column index of the block to show this details to the user.
//                 let sectionName = '';
//                 let sectionIndex = -1;
//                 let columnIndex = -1;

//                 // Find the section index.
//                 for (sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
//                     const section = sections[sectionIndex];

//                     // Find the column index.
//                     columnIndex = section.Columns.findIndex(column => column.BlockContainer?.BlockKey === blockParameter.block.Key);
//                     if (columnIndex > -1) {
//                         sectionName = section.Name;
//                         break;
//                     }
//                 }

//                 const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.TYPE_IS_DIFFERENT_FOR_THIS_KEY_IN_OTHER_BLOCKS', {
//                     section: sectionName || (sectionIndex + 1),
//                     column: columnIndex + 1,
//                     parameterKey: parameter.Key,
//                     parameterType: blockParameter?.parameter?.Type,
//                 });

//                 throw new Error(msg);
//             }
//         }
//     }

//     private validatePageConfigurationData(blockKey: string, pageConfiguration: PageConfiguration) {
//         // Take all blocks except the given one for check if the new data is valid.
//         const blocks = this._pageSubject.getValue().Blocks.filter(block => block.Key !== blockKey);

//         // go for all the existing parameters.
//         const blockParameterKeys = new Map<string, { block: PageBlock, parameter: PageConfigurationParameter }[]>();
//         for (let blockIndex = 0; blockIndex < blocks?.length; blockIndex++) {
//             const block = blocks[blockIndex];

//             if (block?.PageConfiguration) {
//                 for (let parameterIndex = 0; parameterIndex < block.PageConfiguration.Parameters?.length; parameterIndex++) {
//                     const parameter = block.PageConfiguration.Parameters[parameterIndex];

//                     // If the parameter key isn't exist insert it to the map,
//                     // else, it's should be with the same Type so add the other blocks and parameters to the array in the map.
//                     if (!blockParameterKeys.has(parameter.Key)) {
//                         blockParameterKeys.set(parameter.Key, [{block, parameter}]);
//                     } else {
//                         const arr = blockParameterKeys.get(parameter.Key);
//                         arr.push({block, parameter});
//                         blockParameterKeys.set(parameter.Key, arr);
//                     }
//                 }
//             }
//         }

//         const parameterKeys = new Map<string, PageConfigurationParameter>();

//         // Validate the pageConfiguration parameters.
//         for (let parameterIndex = 0; parameterIndex < pageConfiguration?.Parameters?.length; parameterIndex++) {
//             const parameter = pageConfiguration.Parameters[parameterIndex];

//             // Validate the parameters on the pageConfiguration input.
//             this.validatePageConfigurationParametersOnCurrentBlock(parameterKeys, parameter);

//             // Validate the parameters from pageConfiguration input on the other page blocks.
//             this.validatePageConfigurationParametersOnPageBlocks(blockParameterKeys, parameter);
//         }
//     }

//     private getBlockByKey(blockKey: string): PageBlock {
//         let blockToFind: PageBlock = null;

//         const page = this._pageSubject.getValue();

//         for (let index = 0; index < page.Blocks.length; index++) {
//             const pb = page.Blocks[index];
//             if (pb.Key === blockKey) {
//                 blockToFind = pb;
//                 break;
//             }
//         }

//         return blockToFind;
//     }

//     private changeCursorOnDragStart() {
//         document.body.classList.add('inheritCursors');
//         document.body.style.cursor = 'grabbing';
//     }

//     private changeCursorOnDragEnd() {
//         document.body.classList.remove('inheritCursors');
//         document.body.style.cursor = 'unset';
//     }

//     /***********************************************************************************************/
//     /*                                  Public functions
//     /***********************************************************************************************/

//     getBlockEditor(blockKey: string): IEditor {
//         let res = null;
//         const block = this.getBlockByKey(blockKey);

//         if (block) {
//             const key = this.getRemoteLoaderMapKey(block.Configuration.Resource, block.Configuration.AddonUUID);
//             const remoteLoaderOptions = this._blocksEditorsRemoteLoaderOptionsMap.get(key);
            
//             if (block && remoteLoaderOptions) {
//                 // If there is schema then support ConfigurationPerScreenSize
//                 const abRelation = this._availableBlocksDataSubject.getValue().find(ab => 
//                     ab.RelationAddonUUID === block.Configuration.AddonUUID && ab.RelationName === block.Configuration.Resource);
                
//                 const hostObject = this.getCommonHostObject(block, abRelation?.RelationSchema !== null); 
    
//                 // Added page to the host object of the editor (only for edit).
//                 hostObject['page'] = this._pageSubject.getValue();

//                 res = {
//                     id: blockKey,
//                     type: 'block',
//                     title: block.Configuration.Resource,
//                     remoteModuleOptions: remoteLoaderOptions,
//                     hostObject: JSON.parse(JSON.stringify(hostObject))
//                 }
//             }
//         }

//         return res;
//     }

//     getBlocksRemoteLoaderOptions(relationName: string, addonUUID: string) {
//         const key = this.getRemoteLoaderMapKey(relationName, addonUUID);
//         const remoteLoaderOptions: PepRemoteLoaderOptions = this._blocksRemoteLoaderOptionsMap.get(key);
//         return remoteLoaderOptions;
//     }

//     getBlockHostObject(block: PageBlockView): IPageBlockHostObject {
//         // For the block host object we send PageBlockView and not PageBlock
//         let hostObject = this.getCommonHostObject(block);

//         // Add parameters (obsolete).
//         hostObject.parameters = this._pageParameters.getValue(); // this._consumerParametersMapSubject.getValue()?.get(block.Key) || null;

//         return hostObject;
//     }

//     getScreenType(size: PepScreenSizeType): DataViewScreenSize {
//         const screenType: DataViewScreenSize =
//             size < PepScreenSizeType.MD ? 'Landscape' :
//             (size === PepScreenSizeType.MD || size === PepScreenSizeType.SM ? 'Tablet' : 'Phablet');

//         return screenType;
//     }

//     getSectionColumnKey(sectionKey: string = '', index: string = '') {
//         return `${sectionKey}_column_${index}`;
//     }

//     getIsHidden(hideIn: DataViewScreenSize[], currentScreenType: DataViewScreenSize) {
//         return hideIn?.length > 0 ? hideIn.some(hi => hi === currentScreenType) : false;
//     }

//     navigateToEditor(editorType: EditorType, id: string): boolean {
//         let success = false;

//         // Cannot navigate into 'page-builder' because this is first and const in the editorsBreadCrumbs.
//         if (editorType !== 'page-builder' && id?.length > 0) {
//             // Check which editor we have now
//             const currentEditor = this._editorsBreadCrumb[this._editorsBreadCrumb.length - 1];

//             // Only if it's another editor.
//             if(currentEditor.id !== id) {
//                 if (currentEditor.type !== 'page-builder') {
//                     // Always pop the last and insert the current.
//                     this._editorsBreadCrumb.pop();
//                 }

//                 let editor = this.getEditor(editorType, id);

//                 if (editor) {
//                     this._editorsBreadCrumb.push(editor);
//                     this.changeCurrentEditor();
//                     success = true;
//                 } else {
//                     success = false;
//                 }
//             }
//         }

//         return success;
//     }

//     navigateBackFromEditor() {
//         // Keep the page builder editor.
//         if (this._editorsBreadCrumb.length > 1) {
//             // Maybe we want to compare the last editor for validation ?
//             const lastEditor = this._editorsBreadCrumb.pop();
//             this.changeCurrentEditor();
//         }
//     }

//     updatePageFromEditor(pageData: IPageEditor) {
//         // Update editor title
//         const currentEditor = this._editorSubject.getValue();
//         if (currentEditor.type === 'page-builder' && currentEditor.id === 'main') {
//             currentEditor.title = pageData.pageName;
//             this.notifyEditorChange(currentEditor);
//         }

//         const currentPage = this._pageSubject.getValue();

//         if (currentPage) {
//             currentPage.Name = pageData.pageName;
//             currentPage.Description = pageData.pageDescription;
//             currentPage.Layout.MaxWidth = pageData.maxWidth;
//             currentPage.Layout.HorizontalSpacing = pageData.horizontalSpacing;
//             currentPage.Layout.VerticalSpacing = pageData.verticalSpacing;
//             currentPage.Layout.SectionsGap = pageData.sectionsGap;
//             currentPage.Layout.ColumnsGap = pageData.columnsGap;
//             // currentPage.Layout.RoundedCorners = pageData.roundedCorners;

//             this.notifyPageChange(currentPage);
//         }
//     }

//     updateSectionFromEditor(sectionData: ISectionEditor) {
//         const sections = this._sectionsSubject.getValue();
//         const sectionIndex = sections.findIndex(section => section.Key === sectionData.id);

//         // Update section details.
//         if (sectionIndex >= 0) {
//             const currentSection = sections[sectionIndex];
//             currentSection.Name = sectionData.sectionName;
//             currentSection.Split = sectionData.split;
//             currentSection.Height = sectionData.height;
//             currentSection.FillHeight = sectionData.fillHeight;

//             let needToRaiseLoad = false;

//             // Get the new columns number from currentSection.Split, if its undefined put a default 1.
//             const newColumnsLength = currentSection.Split?.split(' ').length || 1;
//             if (newColumnsLength > currentSection.Columns.length) {
//                 while (newColumnsLength > currentSection.Columns.length) {
//                     currentSection.Columns.push({});
//                 }
//             } else if (newColumnsLength < currentSection.Columns.length) {
//                 const blocksIdsToRemove = [];
//                 while (newColumnsLength < currentSection.Columns.length) {
//                     const colunm = currentSection.Columns.pop();
//                     // If there is block in this column delete it.
//                     if (colunm.BlockContainer) {
//                         blocksIdsToRemove.push(colunm.BlockContainer.BlockKey);
//                     }
//                 }

//                 if (blocksIdsToRemove.length > 0) {
//                     needToRaiseLoad = true;
//                     this.removePageBlocks(blocksIdsToRemove);
//                 }
//             }

//             // Update editor title
//             const currentEditor = this._editorSubject.getValue();
//             if (currentEditor.type === 'section' && currentEditor.id === currentSection.Key) {
//                 currentEditor.title = this.getSectionEditorTitle(currentSection, sectionIndex);
//                 this.notifyEditorChange(currentEditor);
//             }

//             // Update sections change.
//             this.notifySectionsChange(sections, needToRaiseLoad);
//         }
//     }

//     addSection(section: PageSection = null) {
//         // Create new section
//         if (!section) {
//             section = {
//                 Key: PepGuid.newGuid(),
//                 Columns: [{}], // Add empty section column
//                 Hide: []
//             }
//         }

//         // Add the new section to page layout.
//         const sections = this._pageSubject.getValue().Layout.Sections;
//         sections.push(section);
//         this.notifySectionsChange(sections, false);
//     }

//     removeSection(sectionId: string) {
//         const sections = this._sectionsSubject.getValue();
//         const index = sections.findIndex(section => section.Key === sectionId);
//         if (index > -1) {
//             let needToRaiseLoad = false;

//             // Get the blocks id's to remove.
//             const blocksIdsToRemove = sections[index].Columns.map(column => column?.BlockContainer?.BlockKey);

//             // Remove the blocks by ids.
//             if (blocksIdsToRemove.length > 0) {
//                 needToRaiseLoad = true;
//                 this.removePageBlocks(blocksIdsToRemove)
//             }

//             // Remove section.
//             sections.splice(index, 1);
//             this.notifySectionsChange(sections, needToRaiseLoad);
//         }
//     }

//     hideSection(sectionId: string, hideIn: DataViewScreenSize[]) {
//         const sections = this._sectionsSubject.getValue();
//         const index = sections.findIndex(section => section.Key === sectionId);
//         if (index > -1) {
//             sections[index].Hide = hideIn;
//             this.notifySectionsChange(sections, false);
//         }
//     }

//     onSectionDropped(event: CdkDragDrop<any[]>) {
//         const sections = this._sectionsSubject.getValue();
//         moveItemInArray(sections, event.previousIndex, event.currentIndex);
//         this.notifySectionsChange(sections, false);
//     }

//     onSectionDragStart(event: CdkDragStart) {
//         this.changeCursorOnDragStart();
//         this._draggingSectionKey.next(event.source.data);
//     }

//     onSectionDragEnd(event: CdkDragEnd) {
//         this.changeCursorOnDragEnd();
//         this._draggingSectionKey.next('');
//     }

//     removeBlock(blockId: string) {
//         // Remove the block.
//         this.removePageBlocks([blockId]);

//         // Remove the block from section column.
//         const sections = this._sectionsSubject.getValue();

//         for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
//             const section = sections[sectionIndex];

//             // Remove the block container.
//             const columnIndex = section.Columns.findIndex(column => column.BlockContainer?.BlockKey === blockId);
//             if (columnIndex > -1) {
//                 delete section.Columns[columnIndex].BlockContainer;
//                 this.notifySectionsChange(sections, true);

//                 return;
//             }
//         }
//     }

//     hideBlock(sectionId: string, blockId: string, hideIn: DataViewScreenSize[]) {
//         const sections = this._sectionsSubject.getValue();

//         const index = sections.findIndex(section => section.Key === sectionId);
//         if (index > -1) {
//             const columnIndex = sections[index].Columns.findIndex(column => column.BlockContainer?.BlockKey === blockId);
//             if (columnIndex > -1) {
//                 sections[index].Columns[columnIndex].BlockContainer.Hide = hideIn;
//                 this.notifySectionsChange(sections, false);
//             }
//         }
//     }

//     onBlockDropped(event: CdkDragDrop<any[]>, sectionId: string) {
//         if (event.previousContainer.id === 'availableBlocks') {
//             // Check that the blocks number are less then the limit.
//             const page = this._pageSubject.getValue();

//             // Validate if blocks number allow.
//             if (page.Blocks.length >= this.BLOCKS_NUMBER_LIMITATION_OBJECT.value) {
//                 this.utilitiesService.showDialogMsg(this.translate.instant('MESSAGES.BLOCKS_COUNT_LIMIT_MESSAGE'));
//             } else {
//                 // Get the block relation (previousContainer.data is IPepDraggableItem and inside we have AvailableBlock object).
//                 const draggableItem: IPepDraggableItem = event.previousContainer.data[event.previousIndex] as IPepDraggableItem;

//                 if (draggableItem) {
//                     // lock the screen untill the editor will be loaded.
//                     this._lockScreenSubject.next(true);

//                     // Create new block from the availableBlockData (previousContainer.data.availableBlockData is AvailableBlockData object).
//                     const availableBlockData: IAvailableBlockData = draggableItem.data.availableBlockData;

//                     let block: PageBlock = {
//                         Key: PepGuid.newGuid(),
//                         // Relation: relation, // The whole relation is saved on the block but for calculate it later we use only the relation.Name & relation.AddonUUID
//                         Configuration: {
//                             Resource: availableBlockData.RelationName, // relation.Name,
//                             AddonUUID: availableBlockData.RelationAddonUUID, // relation.AddonUUID,
//                             Data: {}
//                         },
//                     }

//                     // Get the column.
//                     const currentColumn = this.getSectionColumnById(event.container.id);

//                     // Set the block key in the section block only if there is a blank column.
//                     if (currentColumn && !currentColumn.BlockContainer) {
//                         currentColumn.BlockContainer = {
//                             BlockKey: block.Key
//                         };

//                         // Add the block to the page blocks and navigate to block editor when the block will loaded.
//                         this.addPageBlock(block, true);
//                     }
//                 } else {
//                     console.log("draggableItem is not a IPepDraggableItem type");
//                 }
//             }
//         } else {
//             // If the block moved between columns in the same section or between different sections but not in the same column.
//             if (event.container.id !== event.previousContainer.id) {
//                 // Get the column.
//                 const currentColumn = this.getSectionColumnById(event.container.id);
//                 // Get the previous column.
//                 const previuosColumn = this.getSectionColumnById(event.previousContainer.id);

//                 currentColumn.BlockContainer = previuosColumn.BlockContainer;
//                 delete previuosColumn.BlockContainer;

//                 // Raise block progress change to update the subject.
//                 this.notifyBlockProgressMapChange();
//             }
//         }
//     }

//     onBlockDragStart(event: CdkDragStart) {
//         this.changeCursorOnDragStart();
//         // Take the block key if exist, else take the available block key (relation key).
//         const blockKey = event.source.data?.BlockKey || event.source.data?.Key;
//         this._draggingBlockKey.next(blockKey);
//     }

//     onBlockDragEnd(event: CdkDragEnd) {
//         this.changeCursorOnDragEnd();
//         this._draggingBlockKey.next('');
//     }

//     updateBlockLoaded(blockKey: string) {
//         this.setBlockAsLoadedAndCalculateCurrentPriority(blockKey);
//     }

//     updateBlockConfiguration(blockKey: string, configuration: any) {
//         const block = this.getBlockByKey(blockKey);

//         if (block) {
//             block.Configuration.Data = configuration;
//             this.notifyBlockChange(block);
//         }
//     }

//     updateBlockConfigurationField(blockKey: string, fieldKey: string, fieldValue: any) {
//         const block = this.getBlockByKey(blockKey);

//         try {
//             if (block) {
//                 const currentScreenType = this.getScreenType(this._screenSizeSubject.getValue());

//                 // If it's Landscape mode then set the field to the regular (Configuration -> Data -> field hierarchy).
//                 if (currentScreenType === 'Landscape') {
//                     // Update confuguration data only if the value is not undefined (cannot reset the root).
//                     if (fieldValue !== undefined) {
//                         this.updateConfigurationDataFieldValue(block, fieldKey, fieldValue);
//                         this.notifyBlockChange(block);
//                     }
//                 } else {
//                     // Get this relation from the online relation and not from the block.
//                     const availableBlocksData = this._availableBlocksDataSubject.getValue().find(abd => 
//                         abd.RelationAddonUUID === block.Configuration.AddonUUID && abd.RelationName === block.Configuration.Resource);
//                     let canConfigurePerScreenSize = false;

//                     if (availableBlocksData?.RelationSchema?.Fields) {
//                         const propertiesHierarchy = fieldKey.split('.');
//                         canConfigurePerScreenSize = this.searchFieldInSchemaFields(availableBlocksData.RelationSchema.Fields, propertiesHierarchy);
//                     }

//                     // Update
//                     if (canConfigurePerScreenSize) {
//                         this.updateConfigurationPerScreenSizeFieldValue(block, fieldKey, fieldValue, currentScreenType);
//                     } else {
//                         // Update confuguration data.
//                         this.updateConfigurationDataFieldValue(block, fieldKey, fieldValue);
//                     }

//                     this.notifyBlockChange(block);
//                 }
//             }
//         } catch (err) {
//             console.log(`set-configuration-field is failed with error: ${err}`);
//         }
//     }

//     updateBlockPageConfiguration(blockKey: string, pageConfiguration: PageConfiguration) {
//         const block = this.getBlockByKey(blockKey);
        
//         if (block) {
//             try {
//                 // Validate the block page configuration data, if validation failed an error will be thrown.
//                 this.validatePageConfigurationData(blockKey, pageConfiguration);

//                 block.PageConfiguration = pageConfiguration;
//                 this.notifyBlockChange(block);

//                 // TODO: Raise load event???

//                 // // Calculate all filters by the updated page configuration.
//                 // this.buildConsumersParameters();
//             } catch (err) {
//                 // Go back from block editor.
//                 this.navigateBackFromEditor();

//                 // Remove the block and show message.
//                 const title = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.BLOCK_HAS_REMOVED');
//                 this.utilitiesService.showDialogMsg(err.message, title);
//                 this.removeBlock(block.Key);
//             }
//         }
//     }

//     setBlockParameter(blockKey: string, event: { key: string, value: any }) {
//         const parameters = {};
//         parameters[event.key] = event.value;
//         this.setBlockParameters(blockKey, { parameters });
//     }
    
//     setBlockParameters(blockKey: string, event: { parameters: any }) {
//         const block = this.getBlockByKey(blockKey);
        
//         // Only if this block can raise this parameter (is declared as producer for this parameter key).
//         if (block?.PageConfiguration?.Parameters.length > 0) {
//             let allowToChangeParams = false;

//             Object.keys(event.parameters).forEach(paramKey => {
//                 allowToChangeParams = block?.PageConfiguration?.Parameters.some(param => param.Key === paramKey && param.Produce === true);

//                 // When allowToChangeParams is false stop (we do nothing).
//                 if (allowToChangeParams === false) {
//                     return;
//                 }
//             });

//             // If the keys exist in parameters.
//             if (allowToChangeParams) {
//                 this.emitEvent({
//                     eventKey: CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE,
//                     eventData: {
//                         Page: this._pageSubject.getValue(),
//                         State: {
//                             PageParameters: this._pageParameters.getValue()
//                         },
//                         Changes: {
//                             PageParameters: event.parameters
//                         },
//                     },
//                     completion: (res: IPageClientEventResult) => {
//                         if (res && res.PageView) {
//                             // Load the PageParameters.
//                             this._pageParameters.next(res.State.PageParameters);
                        
//                             // Load the page.
//                             this.notifyPageViewChange(res.PageView);
//                         }
//                     }
//                 });
//             } else {
//                 console.error('The raised parameters is not declared in the block -> pageConfiguration -> parameters array as producer');
//             }
//         }
//     }

//     doesColumnContainBlock(sectionId: string, columnIndex: number): boolean {
//         let res = false;
//         const section = this._sectionsSubject.getValue().find(section => section.Key === sectionId);

//         if (section && columnIndex >= 0 && section.Columns.length > columnIndex) {
//             res = !!section.Columns[columnIndex].BlockContainer;
//         }

//         return res;
//     }

//     setScreenWidth(value: string) {
//         let width = coerceNumberProperty(value, 0);
//         if (width === 0) {
//             this._screenWidthSubject.next('100%');
//             this._screenSizeSubject.next(PepScreenSizeType.XL);
//         } else {
//             this._screenWidthSubject.next(`${width}px`);

//             // Change the size according the width.
//             if (width >= 1920) {
//                 this._screenSizeSubject.next(PepScreenSizeType.XL);
//             } else if (width >= 1280 && width < 1920) {
//                 this._screenSizeSubject.next(PepScreenSizeType.LG);
//             } else if (width >= 960 && width < 1280) {
//                 this._screenSizeSubject.next(PepScreenSizeType.MD);
//             } else if (width >= 600 && width < 960) {
//                 this._screenSizeSubject.next(PepScreenSizeType.SM);
//             } else if (width < 600) {
//                 this._screenSizeSubject.next(PepScreenSizeType.XS);
//             }
//         }
//     }

//     emitEvent(event: any) {
//         const eventData = {
//             detail: event,
//         };

//         const customEvent = new CustomEvent('emit-event', eventData);
//         window.dispatchEvent(customEvent);
//     }

//     doesCurrentPageHasChanges(): boolean {
//         let res = false;
//         const currentPage = this._pageSubject.getValue();

//         if (this._pageAfterLastSave != null && currentPage != null && JSON.stringify(currentPage) !== JSON.stringify(this._pageAfterLastSave)) {
//             res = true;
//         }

//         return res;
//     }

//     /**************************************************************************************/
//     /*                            CPI & Server side calls.
//     /**************************************************************************************/

//     // Get the pages (distinct with the drafts)
//     getPages(addonUUID: string, options: any): Observable<PageRowProjection[]> {
//         // Get the pages from the server.
//         const baseUrl = this.getBaseUrl(addonUUID);
//         return this.httpService.getHttpCall(`${baseUrl}/get_pages_data?${options}`);
//     }

//     createNewPage(addonUUID: string, templateFileName: any, totalPages: number = 0): Observable<Page> {
//         const baseUrl = this.getBaseUrl(addonUUID);
//         return this.httpService.getHttpCall(`${baseUrl}/create_page?templateFileName=${templateFileName}&pageNum=${totalPages+1}`);
//     }
    
//     // Duplicate the page
//     duplicatePage(addonUUID: string, pageKey: string): Observable<any> {
//         const baseUrl = this.getBaseUrl(addonUUID);
//         return this.httpService.getHttpCall(`${baseUrl}/duplicate_page?key=${pageKey}`);
//     }
    
//     // Delete the page
//     deletePage(addonUUID: string, pageKey: string): Observable<any> {
//         const baseUrl = this.getBaseUrl(addonUUID);
//         return this.httpService.getHttpCall(`${baseUrl}/remove_page?key=${pageKey}`);
//     }
    
//     private raisePageLoadEvent(eventData: any, editable: boolean) {
//         const event = {
//             eventKey: CLIENT_ACTION_ON_CLIENT_PAGE_LOAD,
//             eventData: eventData,
//             completion: (res: IPageClientEventResult) => {
//                 if (res && res.PageView && res.AvailableBlocksData) {
//                     // Load the PageParameters.
//                     this._pageParameters.next(res.State.PageParameters);
                
//                     // Load the available blocks.
//                     this._availableBlocksDataSubject.next(res.AvailableBlocksData);
                
//                     // Load the blocks remote loader options.
//                     this.loadBlocksRemoteLoaderOptionsMap(res.AvailableBlocksData);

//                     if (editable) {
//                         // Load the blocks editors remote loader options.
//                         this.loadBlocksEditorsRemoteLoaderOptionsMap(res.AvailableBlocksData);
//                     }

//                     // Load the page.
//                     this.notifyPageViewChange(res.PageView);
//                 }
//             }
//         }

//         this.emitEvent(event);
//     }

//     loadPageBuilder(addonUUID: string, pageKey: string, editable: boolean, queryParameters: Params): void {
//         //  If is't not edit mode get the page from the CPI side.
//         const baseUrl = this.getBaseUrl(addonUUID);

//         // Raise the PageLoad event to get all neccessary data.
//         if (!editable) {
//             this.raisePageLoadEvent({
//                 PageKey: pageKey,
//                 State: {
//                     PageParameters: queryParameters
//                 }
//             }, editable);
//         } else { 
//             // If is't edit mode get the data of the page from the Server side and then raise the PageLoad event to get all the neccessary data.
//             // Get the page (sections and the blocks data) from the server.
//             this.httpService.getHttpCall(`${baseUrl}/get_page_builder_data?key=${pageKey}`)
//                 .subscribe((res: IPageBuilderData) => {
//                     if (res && res.page && res.pagesVariables) {
//                         // Set the pages variables into the service variables.
//                         this.setPagesVariables(res.pagesVariables);

//                         // Load the page for edit mode.
//                         this.notifyPageChange(res.page);

//                         this.raisePageLoadEvent({
//                             Page: res.page,
//                             State: {
//                                 PageParameters: queryParameters
//                             }
//                         }, editable);
//                     }
//             });
//         }
//     }

//     unloadPageBuilder() {
//         this._pageParameters.next({});
//         this.notifySectionsChange([], false);
//         this.removeAllBlocks()
//         this.notifyPageChange(null, true);
//     }

//     // Restore the page to tha last publish
//     restoreToLastPublish(addonUUID: string): Observable<Page> {
//         const page = this._pageSubject.getValue();
//         const baseUrl = this.getBaseUrl(addonUUID);

//         return this.httpService.getHttpCall(`${baseUrl}/restore_to_last_publish?key=${page.Key}`);
//     }

//     // Save the current page in drafts.
//     saveCurrentPage(addonUUID: string): void {
//         const page: Page = this._pageSubject.getValue();
//         const body = JSON.stringify(page);
//         const baseUrl = this.getBaseUrl(addonUUID);
        
//         this.httpService.postHttpCall(`${baseUrl}/save_draft_page`, body).subscribe(savedPage => {
//             this.notifyPageChange(savedPage, true);

//             // Show message
//             const data: PepSnackBarData = {
//                 title: this.translate.instant('MESSAGES.PAGE_SAVED'),
//                 content: '',
//             }

//             const config = this.pepSnackBarService.getSnackBarConfig({
//                 duration: 5000,
//             });

//             this.pepSnackBarService.openDefaultSnackBar(data, config);
//         });
//     }

//     // Publish the current page.
//     publishCurrentPage(addonUUID: string): void {
//         const page: Page = this._pageSubject.getValue();
//         const body = JSON.stringify(page);
//         const baseUrl = this.getBaseUrl(addonUUID);
//         this.httpService.postHttpCall(`${baseUrl}/publish_page`, body).subscribe(savedPage => {
//             this.notifyPageChange(savedPage, true);

//             // Show message
//             const data: PepSnackBarData = {
//                 title: this.translate.instant('MESSAGES.PAGE_PUBLISHED'),
//                 content: '',
//             }

//             const config = this.pepSnackBarService.getSnackBarConfig({
//                 duration: 5000,
//             });

//             this.pepSnackBarService.openDefaultSnackBar(data, config);
//         });
//     }
// }