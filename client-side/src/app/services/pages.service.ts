import { Injectable } from "@angular/core";
import { Params } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { PepGuid, PepHttpService, PepSessionService } from "@pepperi-addons/ngx-lib";
import { PepRemoteLoaderOptions } from "@pepperi-addons/ngx-lib/remote-loader";
import { Page, PageBlock, DataViewScreenSize, PageConfiguration, PageConfigurationParameter } from "@pepperi-addons/papi-sdk";
import { IPageBuilderData, IPageClientEventResult, CLIENT_ACTION_ON_CLIENT_PAGE_LOAD, IAvailableBlockData, 
    CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE, PageBlockView, IPageView, CLIENT_ACTION_ON_CLIENT_PAGE_BLOCK_LOAD, CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK, 
    SYSTEM_PARAMETERS, CLIENT_ACTION_ON_CLIENT_PAGE_SKELETON_LOAD } from 'shared';
import { Observable, BehaviorSubject } from 'rxjs';
import { NavigationService } from "./navigation.service";
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { UtilitiesService } from "./utilities.service";
import { PepSnackBarData, PepSnackBarService } from "@pepperi-addons/ngx-lib/snack-bar";
import { IPageState } from 'shared';
import { QueryParamsService } from "./query-params.service";
import { IParamemeter } from "@pepperi-addons/ngx-composite-lib/manage-parameters";
import { PepLayoutBuilderService, IPepLayoutBlockAddedEvent, IPepLayoutView } from "@pepperi-addons/ngx-composite-lib/layout-builder";

import * as _ from 'lodash';

export interface IPageEditor {
    // id: string,
    pageName: string,
    pageDescription: string,
    parameters: IParamemeter[],
    onLoadFlow: any,
    onParameterChangeFlow: any,
    onChangeFlow: any,
}

export interface IBlockEditor {
    id: string,
    // title: string,
    remoteModuleOptions?: PepRemoteLoaderOptions,
    hostObject?: any
}

export interface IBlockProgress {
    block: PageBlockView;
    loaded: boolean;
    openEditorOnLoaded: boolean,
    priority: number;
    blockLastChanges?: PageBlockView;
    registerStateChangeCallback?: (data: {state: any, configuration: any}) => void;
    registerScreenSizeChangeCallback?: (data: {state: any, configuration: any, screenType: DataViewScreenSize}) => void;
}

export interface IPageBlockHostObject {
    configuration: any;
    configurationSource?: any;
    pageConfiguration?: PageConfiguration;
    pageParameters?: any;
    parameters?: any;
    state?: any;
    page?: Page
}


@Injectable(
//     {
//     providedIn: 'root',
// }
)
export class PagesService {
    readonly BLOCKS_NUMBER_LIMITATION_OBJECT = {
        key: 'BLOCKS_NUMBER_LIMITATION',
        value: 15
    }

    readonly PAGE_SIZE_LIMITATION_OBJECT = {
        key: 'PAGE_SIZE_LIMITATION',
        value: 150
    }

    // This subject is for block number limitation change (Usage only in edit mode).
    private _blocksNumberLimitation: BehaviorSubject<number> = new BehaviorSubject<number>(this.BLOCKS_NUMBER_LIMITATION_OBJECT.value);
    get blocksNumberLimitationChange$(): Observable<any> {
        return this._blocksNumberLimitation.asObservable().pipe(distinctUntilChanged());
    }

    // This subject is for load available blocks data on the main editor (Usage only in edit mode).
    private _availableBlocksDataSubject: BehaviorSubject<IAvailableBlockData[]> = new BehaviorSubject<IAvailableBlockData[]>([]);
    get availableBlocksDataLoadedSubject$(): Observable<IAvailableBlockData[]> {
        return this._availableBlocksDataSubject.asObservable().pipe(distinctUntilChanged());
    }

    // For load the blocks
    private _blocksRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();
    // For load the blocks editors
    private _blocksEditorsRemoteLoaderOptionsMap = new Map<string, PepRemoteLoaderOptions>();

    // This subjects is for load the page blocks into map for better performance and order them by priorities.
    private _pageBlockProgressMap = new Map<string, IBlockProgress>();
    get pageBlockProgressMap(): ReadonlyMap<string, IBlockProgress> {
        return this._pageBlockProgressMap;
    }
    private _pageBlockProgressMapSubject = new BehaviorSubject<ReadonlyMap<string, IBlockProgress>>(this.pageBlockProgressMap);
    get pageBlockProgressMapChange$(): Observable<ReadonlyMap<string, IBlockProgress>> {
        return this._pageBlockProgressMapSubject.asObservable();
    }

    // This subject is for page block change.
    private _pageBlockSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
    get pageBlockChange$(): Observable<string> {
        return this._pageBlockSubject.asObservable();
    }

    // This is for know if the user made changes in the draft page and not save it yet.
    private _pageAfterLastSave = null;

    // This subject is for page change .
    // Note. all use is _pageInEditorSubject is only in edit mode !!!
    private _pageInEditorSubject: BehaviorSubject<Page> = new BehaviorSubject<Page>(null);
    get pageDataForEditorChange$(): Observable<Page> {
        return this._pageInEditorSubject.asObservable().pipe(filter(page => !!page));
    }
    get pageDataForEditor(): Page {
        return this._pageInEditorSubject.getValue();
    }
    
    // This subject is for page view change.
    private _pageViewSubject: BehaviorSubject<IPageView> = new BehaviorSubject<IPageView>(null);
    // get pageViewLoad$(): Observable<IPageView> {
    //     return this._pageViewSubject.asObservable().pipe(distinctUntilChanged((prevPage, nextPage) => prevPage?.Key === nextPage?.Key));
    // }
    get pageViewDataChange$(): Observable<IPageView> {
        return this._pageViewSubject.asObservable().pipe(filter(page => !!page));
    }

    private _pageState: BehaviorSubject<IPageState> = new BehaviorSubject<IPageState>(null);
    get pageStateChange$(): Observable<IPageState> {
        return this._pageState.asObservable().pipe(distinctUntilChanged());
    }
    
    // This is for editor mode for load the blocks (with the CPI events only once) after the block is changed.
    private _blockLoadEventSubject = new BehaviorSubject<{ blockKey: string }>({ blockKey: '' });
    get blockLoadEventDebouncedSubject$(): Observable<{ blockKey: string }> {
        return this._blockLoadEventSubject.asObservable().pipe(debounceTime(250));
    }
    
    constructor(
        private translate: TranslateService,
        // dialogService: PepDialogService,
        private utilitiesService: UtilitiesService,
        private pepSnackBarService: PepSnackBarService,
        private sessionService: PepSessionService,
        private httpService: PepHttpService,
        private navigationService: NavigationService,
        private queryParamsService: QueryParamsService,
        private layoutBuilderService: PepLayoutBuilderService
    ) {
        // super(translate, dialogService);

        // TODO: load the blocks
        // this.pageViewLoad$.subscribe((pageView: IPageView) => {
        //     this.loadBlocks(pageView);
        // });

        this.availableBlocksDataLoadedSubject$.subscribe(availableBlocksData => {
            // Load the blocks remote loader options.
            this.loadBlocksRemoteLoaderOptionsMap(availableBlocksData);

            if (this.layoutBuilderService.editMode) {
                // Load the blocks editors remote loader options.
                this.loadBlocksEditorsRemoteLoaderOptionsMap(availableBlocksData);
            }
        });

        this.pageStateChange$.subscribe((state: IPageState) => {
            // Handle the page state - set it on the url.
            if (state) {
                const queryParams = this.queryParamsService.getQueryParamsFromState(state);
                this.navigationService.updateQueryParams(queryParams, true);
            }
        });

        // Create subject for load the events for block load only once when there is changes in the blocks editor.
        this.blockLoadEventDebouncedSubject$.subscribe((eventValue: { blockKey: string }) => {
            if (this.layoutBuilderService.editMode) {
                this.raiseClientEventForBlock(CLIENT_ACTION_ON_CLIENT_PAGE_BLOCK_LOAD, eventValue.blockKey, null);
            }
        });
    }
    
    private loadBlocks(pageView: IPageView) {
        if (pageView) {
            // Some logic to load the blocks by priority (first none or Produce only, second Consume & Produce, third Consume only).
            if (pageView.Blocks) {
                pageView.Blocks.forEach(block => {
                    const isUIBlock = this.doesBlockExistInUI(block.Key);

                    if (isUIBlock) {
                        this.addBlockProgress(block);
                    } else {
                        // If this block is not declared on any section (not UI block) do nothing.
                    }
                });

                this.notifyBlockProgressMapChange();
            }
        }
    }

    private doesBlockExistInUI(blockKey: string) {
        // Check if the block key exist in layout -> sections -> columns (if shows in the UI).
        const layoutView = this._pageViewSubject.getValue();

        for (let sectionIndex = 0; sectionIndex < layoutView.Layout.Sections.length; sectionIndex++) {
            const section = layoutView.Layout.Sections[sectionIndex];

            for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                const column = section.Columns[columnIndex];

                if (column.BlockContainer?.BlockKey === blockKey) {
                    return true;
                }
            }
        }

        return false;
    }

    private addBlockProgress(blockView: PageBlockView, openEditorOnLoaded: boolean = false): IBlockProgress {
        const priority = 1;

        // Create block progress and add it to the map.
        const initialProgress: IBlockProgress = {
            loaded: false,
            openEditorOnLoaded,
            priority,
            block: blockView
        };

        this._pageBlockProgressMap.set(blockView.Key, initialProgress);

        return initialProgress;
    }

    private getPageViewBlockForEditor(block: PageBlock): PageBlockView {
        const blockView: PageBlockView = {
            Key: block.Key,
            RelationData: { 
                Name: block.Configuration.Resource,
                AddonUUID: block.Configuration.AddonUUID
            },
            Configuration: block.Configuration.Data,
            ConfigurationPerScreenSize: block.ConfigurationPerScreenSize
        };

        return blockView;
    }

    private handlePageBlockViewChangeResult(res: IPageClientEventResult, addedBlockKey: string = '') {
        // Set the state.
        this.notifyStateChange(res.State);
        const pageView = this._pageViewSubject.getValue();

        // Merge the page view blocks.
        for (let index = 0; index < res.PageView.Blocks.length; index++) {
            const blockView = res.PageView.Blocks[index];
            
            // If it's the new block add it, Else just update it.
            if (blockView.Key === addedBlockKey) {
                // Add the block view to the block progress.
                this.addBlockProgress(blockView, true);

                // Add the block view to the page view blocks.
                pageView.Blocks.push(blockView);

                // Update the page view
                this.notifyPageViewChange(pageView);

                // Update the progress.
                this.notifyBlockProgressMapChange();
            } else {
                // Update the block view last changes in the block progress.
                const bpToUpdate = this._pageBlockProgressMap.get(blockView.Key);
                if (bpToUpdate) {
                    let needToRaiseChangeEvent = false;
    
                    // We don't override blocks changes in the page view subject, only in the progress map.
                    if (bpToUpdate?.registerStateChangeCallback) {
                        if (JSON.stringify(bpToUpdate.blockLastChanges) !== JSON.stringify(blockView)) {
                            bpToUpdate.blockLastChanges = blockView;
                            needToRaiseChangeEvent = true;
                        }
                    } else {
                        // This is for support old blocks - always raise event.
                        bpToUpdate.block = blockView;
                        needToRaiseChangeEvent = true;
                    }
    
                    // Update the page block as change.
                    if (needToRaiseChangeEvent) {
                        this._pageBlockSubject.next(blockView.Key);
                    }
                }
            }
        }
    }
    
    private raiseClientEventForPageSkeletonLoad(initialPageState: IPageState, eventDataExtra: any) {
        // Show sceleton.
        this.layoutBuilderService.showSkeleton(true);

        const event = {
            eventKey: CLIENT_ACTION_ON_CLIENT_PAGE_SKELETON_LOAD,
            eventData: {
                ...eventDataExtra,
                State: initialPageState
            },
            completion: (res: IPageClientEventResult) => {
                if (res && res.PageView && res.AvailableBlocksData) {

                    // Load the available blocks.
                    this._availableBlocksDataSubject.next(res.AvailableBlocksData);

                    // Load the state.
                    this.notifyStateChange(res.State);
                    
                    // Load the page view for the first time.
                    this.notifyPageViewChange(res.PageView);
                } else {
                    // TODO: Show error?
                }
            }
        }

        // Emit the page pre load event.
        this.emitEvent(event);
    }

    private raiseClientEventForPageLoad(initialPageState: IPageState, eventDataExtra: any) {
        const event = {
            eventKey: CLIENT_ACTION_ON_CLIENT_PAGE_LOAD,
            eventData: {
                ...eventDataExtra,
                State: initialPageState
            },
            completion: (res: IPageClientEventResult) => {
                // Hide skeleton and show blocks instead.
                this.layoutBuilderService.showSkeleton(false);

                if (res && res.PageView && res.AvailableBlocksData) {
                    // Load the available blocks.
                    this._availableBlocksDataSubject.next(res.AvailableBlocksData);

                    // Load the state.
                    this.notifyStateChange(res.State);
                    
                    // Load the page view for the first time.
                    this.notifyPageViewChange(res.PageView);

                    // Load the blocks.
                    this.loadBlocks(res.PageView);
                } else {
                    // TODO: Show error?
                }
            }
        }

        // Emit the page load event.
        this.emitEvent(event);
    }

    private raiseClientEventsForPageLoad(queryParameters: Params, eventDataExtra: any) {
        const initialPageState: IPageState = this.queryParamsService.getStateFromQueryParams(queryParameters);
        this.raiseClientEventForPageSkeletonLoad(initialPageState, eventDataExtra);
        this.raiseClientEventForPageLoad(initialPageState, eventDataExtra);
    }

    private raiseClientEventForBlock(eventKey: string, blockKey: string, eventDataExtra: any, newBlock: boolean = false) {
        const eventData = {
            BlockKey: blockKey,
            State: this._pageState.getValue(), // Get the current state.
            ...eventDataExtra,
        };

        // For editor (also in preview mode take the page object, Else take the page key).
        if (this.layoutBuilderService.editMode) {
            eventData['Page'] = this._pageInEditorSubject.getValue();
        } else {
            eventData['PageKey'] = this._pageViewSubject.getValue().Key;
        }
 
        this.emitEvent({
            eventKey: eventKey,
            eventData: eventData,
            completion: (res: IPageClientEventResult) => {
                if (res && res.PageView) {
                    // Update all the data (State and updated blocks).
                    this.handlePageBlockViewChangeResult(res, newBlock ? blockKey : '');
                } else {
                    // TODO: Show error?

                    // TODO: Unlock?
                    // this.layoutBuilderService.lockScreen(false);
                }
            }
        });
    }

    private removePageBlock(blockId: string) {
        // First remove the block from the page view.
        const pageView = this._pageViewSubject.getValue();
        const bvIndex = pageView?.Blocks.findIndex(block => block.Key === blockId);

        if (bvIndex > -1) {
            pageView.Blocks.splice(bvIndex, 1);
            this.notifyPageViewChange(pageView);
        }

        // Remove the block also from the page in editor.
        const page = this._pageInEditorSubject.getValue();
        const blockIndex = page?.Blocks.findIndex(block => block.Key === blockId);

        if (blockIndex > -1) {
            page.Blocks.splice(blockIndex, 1);
            this.notifyPageInEditorChange(page, false);
        }

        // Remove the block data from the state
        const pageState = this._pageState.getValue();
        if (pageState?.BlocksState.hasOwnProperty(blockId)) {
            delete pageState.BlocksState[blockId];
            this.notifyStateChange(pageState);
        } 
    }

    private removeAllBlocks() {
        // First remove the blocks from the page view.
        const pageView = this._pageViewSubject.getValue();

        if (pageView) {
            pageView.Blocks = [];
            this.notifyPageViewChange(pageView);
        }

        // Remove the blocks from the page in editor.
        const page = this._pageInEditorSubject.getValue();

        if (page) {
            page.Blocks = [];
            this.notifyPageInEditorChange(page, false);
        }

        this._pageBlockProgressMap.clear();

        // We don't need this here
        // this.notifyBlockProgressMapChange();
    }
    
    private notifyStateChange(state: IPageState) {
        this._pageState.next(state);
    }

    private notifyPageInEditorChange(page: Page, changePageView = true, setLastSavedPage = false) {
        this._pageInEditorSubject.next(page);
        
        if (setLastSavedPage) {
            this._pageAfterLastSave = page ?JSON.parse(JSON.stringify(page)) : null;
        }

        if (changePageView) {
            // Update the page view (except the blocks cause maybe the blocks are changed with data from the CPI).
            let pageView: IPageView = this._pageViewSubject.getValue();
            if (page) {
                pageView.Name = page.Name;
                pageView.Description = page.Description;
                pageView.Layout = page.Layout;
            } else {
                pageView = null;
            }
                
            this.notifyPageViewChange(pageView);
        }
    }
    
    notifyLayoutViewChanged(layoutView: IPepLayoutView) {
        if (this.layoutBuilderService.editMode) {
            const page = this._pageInEditorSubject.getValue();
            page.Layout = layoutView.Layout;
            this.notifyPageInEditorChange(page, false);
        }

        const pageView = this._pageViewSubject.getValue();
        pageView.Layout = layoutView.Layout;

        this.notifyPageViewChange(pageView);
    }

    // TODO:
    private notifyPageViewChange(pageView: IPageView) {
        // Update the page for the view.
        this._pageViewSubject.next(pageView);
        
        // Update the sections for the view.
        // this._sectionsViewSubject.next(pageView?.Layout.Sections || []);
    }

    private notifyBlockChange(block: PageBlock, newBlock = false) {
        const page = this._pageInEditorSubject.getValue();

        if (newBlock) {
            // Add the block to the page blocks and raise OnClientPageBlockLoad event for calculating the block view.
            page.Blocks.push(block);
        } else {
            // Update the block in the page blocks.
            const currentBlockIndex = page.Blocks.findIndex(b => b.Key === block.Key);
            if (currentBlockIndex > -1) {
                page.Blocks[currentBlockIndex] = block;
            }
        }
        
        // Here we update the page editor and the page view cause the layout is updated.
        this.notifyPageInEditorChange(page);

        // Notify that the block is changed (to raise the CPI event).
        if (newBlock) {
            // Raise the event for the new block.
            if (this.layoutBuilderService.editMode) {
                this.raiseClientEventForBlock(CLIENT_ACTION_ON_CLIENT_PAGE_BLOCK_LOAD, block.Key, null, true);
            }
        } else {
            // Raise the event for the updated block (with debounce time).
            this._blockLoadEventSubject.next({ blockKey: block.Key });
        }
    }

    private notifyBlockProgressMapChange() {
        // This is only when added new block progress or when the block progress loaded changed.
        this._pageBlockProgressMapSubject.next(this.pageBlockProgressMap);
    }

    private getCommonHostObject(block: PageBlockView): IPageBlockHostObject {
        let hostObject: IPageBlockHostObject = {
            configuration: this.getMergedConfigurationData(block)
        };

        const pageState = this._pageState.getValue();

        // TODO: Remove it (obsolete) - All the producers parameters.
        hostObject.pageParameters = pageState?.PageParameters;
       
        // TODO: Remove it (obsolete) - Only parameters that this block is consume (only on the block and not on the editor).
        hostObject.parameters = pageState?.BlocksState[block.Key];

        // Add block state
        hostObject.state = pageState?.BlocksState[block.Key];

        return hostObject;
    }

    private getRemoteLoaderOptions(data: IAvailableBlockData, editor = false): PepRemoteLoaderOptions {
        const remoteLoaderOptions: PepRemoteLoaderOptions = {
            type: 'module',
            remoteEntry: data.PageRemoteLoaderOptions.RemoteEntry,
            // remoteName: '', // For script type, this is the name of the script.
            exposedModule: `./${data.PageRemoteLoaderOptions.ModuleName}`,
            elementName: editor ? data.PageRemoteLoaderOptions.EditorElementName : data.PageRemoteLoaderOptions.ElementName,
            addonId: data.RelationAddonUUID, // For local use (adding the relative path to the assets).
        };

        return remoteLoaderOptions;
    }

    private getBaseUrl(addonUUID: string): string {
        // if (this.isOffline){
        //     return "http://localhost:8088/addon/api/50062e0c-9967-4ed4-9102-f2bc50602d41/addon-cpi";
        // } else {
             // For devServer run server on localhost.
            if(this.navigationService.devServer) {
                return `http://localhost:4500/internal_api`;
            } else {
                const baseUrl = this.sessionService.getPapiBaseUrl();
                return `${baseUrl}/addons/api/${addonUUID}/internal_api`;
            }
        // }
    }

    private setPagesVariables(pagesVariables: any) {
        Object.keys(pagesVariables).forEach(key => {
            const valueAsNumber = Number(pagesVariables[key]);

            if (!isNaN(valueAsNumber)) {
                if (key === this.BLOCKS_NUMBER_LIMITATION_OBJECT.key) {
                    this.BLOCKS_NUMBER_LIMITATION_OBJECT.value = valueAsNumber;
                    this._blocksNumberLimitation.next(valueAsNumber);
                } else if (key === this.PAGE_SIZE_LIMITATION_OBJECT.key) {
                    this.PAGE_SIZE_LIMITATION_OBJECT.value = valueAsNumber;
                }
            }
        })
    }

    private loadBlocksRemoteLoaderOptionsMap(availableBlocksData: IAvailableBlockData[]) {
        this._blocksRemoteLoaderOptionsMap.clear();

        availableBlocksData.forEach(data => {
            const key = this.getRemoteLoaderMapKey(data.RelationName, data.RelationAddonUUID);
            this._blocksRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(data));
        });
    }

    private loadBlocksEditorsRemoteLoaderOptionsMap(availableBlocksData: IAvailableBlockData[]) {
        this._blocksEditorsRemoteLoaderOptionsMap.clear();

        availableBlocksData.forEach(data => {
            const key = this.getRemoteLoaderMapKey(data.RelationName, data.RelationAddonUUID);
            this._blocksEditorsRemoteLoaderOptionsMap.set(key, this.getRemoteLoaderOptions(data, true));
        });
    }

    private getRemoteLoaderMapKey(relationName: string, addonUUID: string): string {
        return `${relationName}_${addonUUID}`;
    }

    private updateConfigurationDataFieldValue(block: PageBlock, propertyNamePath: string, fieldValue: any): void {
        // Update the block configuration data by the propertyNamePath and set the field value (deep set).
        this.setObjectPropertyValue(block.Configuration.Data, propertyNamePath, fieldValue);
    }

    private updateConfigurationPerScreenSizeFieldValue(block: PageBlock, propertyNamePath: string, fieldValue: any, currentScreenType: DataViewScreenSize) {
        // Update the block configuration per screen size according the current screen sizes and the saved values (deep set).
        if (block.ConfigurationPerScreenSize === undefined) {
            block.ConfigurationPerScreenSize = {};
        }

        let objectToUpdate;
        if (currentScreenType === 'Tablet') {
            if (block.ConfigurationPerScreenSize.Tablet === undefined) {
                block.ConfigurationPerScreenSize.Tablet = {};
            }

            objectToUpdate = block.ConfigurationPerScreenSize.Tablet;
        } else { // Phablet
            if (block.ConfigurationPerScreenSize.Mobile === undefined) {
                block.ConfigurationPerScreenSize.Mobile = {};
            }

            objectToUpdate = block.ConfigurationPerScreenSize.Mobile;
        }

        // Update the block configuration data by the propertyNamePath and set the field value.
        this.setObjectPropertyValue(objectToUpdate, propertyNamePath, fieldValue);
    }

    private setObjectPropertyValue(object: any, propertyNamePath: string, value: any): void {
        // Set the object field value by propertyNamePath (deep set).
        if (value !== undefined) {
            _.set(object, propertyNamePath, value);
        } else {
            _.unset(object, propertyNamePath);
        }
    }

    private searchFieldInSchemaFields(schemaFields: any, propertiesHierarchy: Array<string>): boolean {
        let canConfigurePerScreenSize = false;

        if (propertiesHierarchy.length > 0) {
            const startArrayCharIndex = propertiesHierarchy[0].indexOf('[');

            // If it's array then cut the index from the key else use the whole key.
            const currentFieldKey = (startArrayCharIndex === -1) ? propertiesHierarchy[0] : propertiesHierarchy[0].substring(0, startArrayCharIndex);
            const schemaField = schemaFields[currentFieldKey];

            if (schemaField) {
                const isObject = schemaField.Type === 'Object';
                const isArray = schemaField.Type === 'Array';

                // If it's object || array
                if (isObject || isArray) {
                    // If the field index is the last
                    if (propertiesHierarchy.length === 1) {
                        if (schemaField.ConfigurationPerScreenSize === true) {
                            canConfigurePerScreenSize = true;
                        }
                    } else { // Check in deepPropertyName (fields || items).
                        const fieldsObject = (isArray ? schemaField.Items?.Fields : schemaField.Fields) || null;

                        if (fieldsObject) {
                            propertiesHierarchy.shift(); // Remove the first element.
                            canConfigurePerScreenSize = this.searchFieldInSchemaFields(fieldsObject, propertiesHierarchy);
                        }
                    }
                } else {
                    if (propertiesHierarchy.length === 1) {
                        // We don't support resource.
                        if (schemaField.Type !== 'Resource') {
                            if (schemaField.ConfigurationPerScreenSize === true) {
                                canConfigurePerScreenSize = true;
                            }
                        }
                    }
                }
            }
        }

        return canConfigurePerScreenSize;
    }

    private validatePageConfigurationParametersOnCurrentBlock(parameterKeys: Map<string, PageConfigurationParameter>, parameter: PageConfigurationParameter) {
        // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
        if (!parameterKeys.has(parameter.Key)) {
            parameterKeys.set(parameter.Key, parameter);
        } else {
            if (parameter.Type !== parameterKeys.get(parameter.Key)?.Type) {
                const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.TYPE_IS_DIFFERENT_FOR_THIS_KEY', { parameterKey: parameter.Key});
                throw new Error(msg);
            }
        }

        if (!parameter.Produce && !parameter.Consume) {
            const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.CONSUME_AND_PRODUCE_ARE_FALSE', { parameterKey: parameter.Key});
            throw new Error(msg);
        }
    }

    private validatePageConfigurationParametersOnPageBlocks(blockParameterKeys: Map<string, { block: PageBlock, parameter: PageConfigurationParameter }[]>, parameter: PageConfigurationParameter) {
        // If the parameter key isn't exist insert it to the map, else, check the type if isn't the same then throw error.
        if (blockParameterKeys.has(parameter.Key)) {
            const blockParameter = blockParameterKeys.get(parameter.Key)[0];

            if (parameter.Type !== blockParameter?.parameter?.Type) {
                const page = this._pageInEditorSubject.getValue();
                const sections = page?.Layout.Sections || [];
                
                // Find section and column index of the block to show this details to the user.
                let sectionName = '';
                let sectionIndex = -1;
                let columnIndex = -1;

                // Find the section index.
                for (sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
                    const section = sections[sectionIndex];

                    // Find the column index.
                    columnIndex = section.Columns.findIndex(column => column.BlockContainer?.BlockKey === blockParameter.block.Key);
                    if (columnIndex > -1) {
                        sectionName = section.Name;
                        break;
                    }
                }

                const msg = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.TYPE_IS_DIFFERENT_FOR_THIS_KEY_IN_OTHER_BLOCKS', {
                    section: sectionName || (sectionIndex + 1),
                    column: columnIndex + 1,
                    parameterKey: parameter.Key,
                    parameterType: blockParameter?.parameter?.Type,
                });

                throw new Error(msg);
            }
        }
    }

    private validatePageConfigurationData(blockKey: string, pageConfiguration: PageConfiguration) {
        // Take all blocks except the given one for check if the new data is valid.
        const blocks = this._pageInEditorSubject.getValue().Blocks.filter(block => block.Key !== blockKey);

        // go for all the existing parameters.
        const blockParameterKeys = new Map<string, { block: PageBlock, parameter: PageConfigurationParameter }[]>();
        for (let blockIndex = 0; blockIndex < blocks?.length; blockIndex++) {
            const block = blocks[blockIndex];

            if (block?.PageConfiguration) {
                for (let parameterIndex = 0; parameterIndex < block.PageConfiguration.Parameters?.length; parameterIndex++) {
                    const parameter = block.PageConfiguration.Parameters[parameterIndex];

                    // If the parameter key isn't exist insert it to the map,
                    // else, it's should be with the same Type so add the other blocks and parameters to the array in the map.
                    if (!blockParameterKeys.has(parameter.Key)) {
                        blockParameterKeys.set(parameter.Key, [{block, parameter}]);
                    } else {
                        const arr = blockParameterKeys.get(parameter.Key);
                        arr.push({block, parameter});
                        blockParameterKeys.set(parameter.Key, arr);
                    }
                }
            }
        }

        const parameterKeys = new Map<string, PageConfigurationParameter>();

        // Validate the pageConfiguration parameters.
        for (let parameterIndex = 0; parameterIndex < pageConfiguration?.Parameters?.length; parameterIndex++) {
            const parameter = pageConfiguration.Parameters[parameterIndex];

            // Validate the parameters on the pageConfiguration input.
            this.validatePageConfigurationParametersOnCurrentBlock(parameterKeys, parameter);

            // Validate the parameters from pageConfiguration input on the other page blocks.
            this.validatePageConfigurationParametersOnPageBlocks(blockParameterKeys, parameter);
        }
    }

    private getBlockByKeyForEditor(blockKey: string): PageBlock {
        let blockToFind: PageBlock = null;

        const page = this._pageInEditorSubject.getValue();

        for (let index = 0; index < page?.Blocks.length; index++) {
            const pb = page.Blocks[index];
            if (pb.Key === blockKey) {
                blockToFind = pb;
                break;
            }
        }

        return blockToFind;
    }

    /***********************************************************************************************/
    /*                                  Public functions
    /***********************************************************************************************/

    getBlockTitle(blockKey: string): string {
        const block = this.getBlockByKeyForEditor(blockKey);

        const availableBlocksData = this._availableBlocksDataSubject.getValue();
        const av = availableBlocksData?.find(ab => ab.RelationAddonUUID === block.Configuration.AddonUUID && ab.RelationName === block.Configuration.Resource);

        return av?.RelationTitle || block?.Configuration.Resource || blockKey;
    }

    getBlockEditor(blockKey: string): IBlockEditor {
        let res: IBlockEditor = null;
        const block = this.getBlockByKeyForEditor(blockKey);

        if (block) {
            const key = this.getRemoteLoaderMapKey(block.Configuration.Resource, block.Configuration.AddonUUID);
            const remoteLoaderOptions = this._blocksEditorsRemoteLoaderOptionsMap.get(key);
            
            if (block && remoteLoaderOptions) {
                // If there is schema then support ConfigurationPerScreenSize
                const abRelation = this._availableBlocksDataSubject.getValue().find(ab => 
                    ab.RelationAddonUUID === block.Configuration.AddonUUID && ab.RelationName === block.Configuration.Resource);
                
                const blockView: PageBlockView = this.getPageViewBlockForEditor(block);
                const hostObject = this.getCommonHostObject(blockView); 
    
                // To let the block editor the option to know if to show reset (used for ConfigurationPerScreenSize).
                // with this property the editor can show the reset button if configuration property isn't equal to configurationSource property.
                if (abRelation?.RelationSchema !== null) {
                    hostObject.configurationSource = this.getMergedConfigurationData(blockView, true);
                }
                
                // Add pageConfiguration if exist.
                if (block.PageConfiguration) {
                    hostObject.pageConfiguration = block.PageConfiguration;
                }

                // Added page to the host object of the editor (only for edit).
                const pageCopy = JSON.parse(JSON.stringify(this._pageInEditorSubject.getValue()));
                if (!pageCopy.Parameters) {
                    pageCopy.Parameters = [];
                }

                // Add the system parameters to the page.
                for (let index = 0; index < SYSTEM_PARAMETERS.length; index++) {
                    const sp = SYSTEM_PARAMETERS[index];

                    pageCopy.Parameters.push({
                        Key: sp.Key,
                        Type: sp.Type,
                        DefaultValue: sp.DefaultValue,
                    });
                }
                hostObject.page = pageCopy;

                res = {
                    id: blockKey,
                    // type: 'block',
                    // title: block.Configuration.Resource,
                    remoteModuleOptions: remoteLoaderOptions,
                    hostObject: JSON.parse(JSON.stringify(hostObject))
                }
            }
        }

        return res;
    }

    getBlocksRemoteLoaderOptions(relationName: string, addonUUID: string) {
        const key = this.getRemoteLoaderMapKey(relationName, addonUUID);
        const remoteLoaderOptions: PepRemoteLoaderOptions = this._blocksRemoteLoaderOptionsMap.get(key);
        return remoteLoaderOptions;
    }

    getBlockHostObject(block: PageBlockView): IPageBlockHostObject {
        // For the block host object we send PageBlockView and not PageBlock
        let hostObject = this.getCommonHostObject(block);

        return hostObject;
    }

    getMergedConfigurationData(block: PageBlockView, configurationSource = false): any {
        // Copy the object data.
        let configurationData = JSON.parse(JSON.stringify(block.Configuration));
        const currentScreenType = this.layoutBuilderService.getCurrentScreenType();

        // Get the configuration data by the current screen size (if exist then merge it up to Tablet and up to Landscape).
        if (currentScreenType !== 'Landscape' && block.ConfigurationPerScreenSize) {
            if (configurationSource) {
                if (currentScreenType === 'Phablet') {
                    configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);
                }
            } else {
                // Merge from Tablet
                configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Tablet);

                // If currentScreenType === 'Phablet' merge from mobile
                if (currentScreenType === 'Phablet') {
                    configurationData = this.utilitiesService.mergeDeep(configurationData, block.ConfigurationPerScreenSize.Mobile);
                }
            }
        }

        return configurationData;
    }

    updatePageFromEditor(pageData: IPageEditor) {
        const page = this._pageInEditorSubject.getValue();

        if (page) {
            page.Name = pageData.pageName;
            page.Description = pageData.pageDescription;
            page.Parameters = pageData.parameters;
            page.OnLoadFlow = pageData.onLoadFlow;
            page.OnParameterChangeFlow = pageData.onParameterChangeFlow;
            page.OnChangeFlow = pageData.onChangeFlow;
            
            this.notifyPageInEditorChange(page);
        }
    }

    addBlock(blockAddedEvent: IPepLayoutBlockAddedEvent) {
        // Lock the screen.
        this.layoutBuilderService.lockScreen(true);

        // Create new block from the availableBlockData (previousContainer.data.availableBlockData is AvailableBlockData object).
        const availableBlockData: IAvailableBlockData = blockAddedEvent.DraggableItem.data.availableBlockData;

        let block: PageBlock = {
            Key: blockAddedEvent.BlockKey,
            // Relation: relation, // The whole relation is saved on the block but for calculate it later we use only the relation.Name & relation.AddonUUID
            Configuration: {
                Resource: availableBlockData.RelationName, // relation.Name,
                AddonUUID: availableBlockData.RelationAddonUUID, // relation.AddonUUID,
                Data: {}
            },
        }

        this.notifyBlockChange(block, true);
    }

    removePageBlocks(blockIds: string[]) {
        if (blockIds.length > 0) {
            blockIds.forEach(blockId => {
                // Remove the block from the page blocks.
                this.removePageBlock(blockId)

                // Remove the block progress from the map.
                if (this._pageBlockProgressMap.has(blockId)) {
                    this._pageBlockProgressMap.delete(blockId);
                }
            });
        }
    }

    // TODO:
    updateBlockLoaded(blockKey: string) {
        const bpToUpdate = this._pageBlockProgressMap.get(blockKey);

        if (bpToUpdate && !bpToUpdate.loaded) {
            // Load editor only for the first time if openEditorOnLoaded is true.
            // if (bpToUpdate.openEditorOnLoaded) {
            //     // setTimeout 0 for navigate on the UI thread.
            //     setTimeout(() => {
            //         this.navigateToEditor('block', bpToUpdate.block.Key);

            //         // unlock the screen.
            //         this.layoutBuilderService.setLockScreen(false);
            //     }, 0);
            // }
            this.layoutBuilderService.lockScreen(false);
            bpToUpdate.loaded = true;

            this.notifyBlockProgressMapChange();
        }
    }
    
    doesCurrentPageHasChanges(): boolean {
        let res = false;
        const currentPage = this._pageInEditorSubject.getValue();

        if (this._pageAfterLastSave != null && currentPage != null && JSON.stringify(currentPage) !== JSON.stringify(this._pageAfterLastSave)) {
            res = true;
        }

        return res;
    }

    /**************************************************************************************/
    /*                            Blocks editor events handle.
    /**************************************************************************************/
    
    onBlockEditorSetConfiguration(blockKey: string, configuration: any) {
        const block = this.getBlockByKeyForEditor(blockKey);

        if (block) {
            block.Configuration.Data = configuration;
            this.notifyBlockChange(block);
        }
    }

    onBlockEditorConfigurationField(blockKey: string, fieldKey: string, fieldValue: any) {
        const block = this.getBlockByKeyForEditor(blockKey);

        try {
            if (block) {
                const currentScreenType = this.layoutBuilderService.getCurrentScreenType();

                // If it's Landscape mode then set the field to the regular (Configuration -> Data -> field hierarchy).
                if (currentScreenType === 'Landscape') {
                    // Update confuguration data only if the value is not undefined (cannot reset the root).
                    if (fieldValue !== undefined) {
                        this.updateConfigurationDataFieldValue(block, fieldKey, fieldValue);
                        this.notifyBlockChange(block);
                    }
                } else {
                    // Get this relation from the online relation and not from the block.
                    const availableBlocksData = this._availableBlocksDataSubject.getValue().find(abd => 
                        abd.RelationAddonUUID === block.Configuration.AddonUUID && abd.RelationName === block.Configuration.Resource);
                    let canConfigurePerScreenSize = false;

                    if (availableBlocksData?.RelationSchema?.Fields) {
                        const propertiesHierarchy = fieldKey.split('.');
                        canConfigurePerScreenSize = this.searchFieldInSchemaFields(availableBlocksData.RelationSchema.Fields, propertiesHierarchy);
                    }

                    // Update
                    if (canConfigurePerScreenSize) {
                        this.updateConfigurationPerScreenSizeFieldValue(block, fieldKey, fieldValue, currentScreenType);
                    } else {
                        // Update confuguration data.
                        this.updateConfigurationDataFieldValue(block, fieldKey, fieldValue);
                    }

                    this.notifyBlockChange(block);
                }
            }
        } catch (err) {
            console.log(`set-configuration-field is failed with error: ${err}`);
        }
    }

    onBlockEditorSetPageConfiguration(blockKey: string, pageConfiguration: PageConfiguration) {
        const block = this.getBlockByKeyForEditor(blockKey);
        
        if (block) {
            try {
                // Validate the block page configuration data, if validation failed an error will be thrown.
                this.validatePageConfigurationData(blockKey, pageConfiguration);
                block.PageConfiguration = pageConfiguration;
                
                this.notifyBlockChange(block);
            } catch (err) {
                // Cannot do this anymore because the block is handled by the layout builder so just show an error msg.
                const title = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.BLOCK_HAS_REMOVED');
                this.utilitiesService.showDialogMsg(err.message, title);

                // // Go back from block editor.
                // this.navigateBackFromEditor();

                // // Remove the block and show message.
                // const title = this.translate.instant('MESSAGES.PARAMETER_VALIDATION.BLOCK_HAS_REMOVED');
                // this.utilitiesService.showDialogMsg(err.message, title);
                // this.removeBlockFromSection(block.Key);
            }
        }
    }

    /**************************************************************************************/
    /*                            Blocks events handle.
    /**************************************************************************************/
    
    onBlockStateChange(blockKey: string, event: { changes: any }): void {
        if (blockKey) {
            // Create the changes object.
            const changes = { BlocksState: {} };
            changes.BlocksState[blockKey] = event.changes;
            
            this.raiseClientEventForBlock(CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE, blockKey, { Changes: changes });
        }
    }

    onBlockButtonClick(blockKey: string, event: { buttonKey: string }): void {
        if (blockKey) {
            this.raiseClientEventForBlock(CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK, blockKey, { ButtonKey: event.buttonKey });
        }
    }
    
    onRegisterStateChange(blockKey: string, event: { callback: (data: {state: any, configuration: any}) => void }): void {
        const bpToUpdate = this._pageBlockProgressMap.get(blockKey);
        if (bpToUpdate) {
            bpToUpdate.registerStateChangeCallback = event.callback;
        }
    }

    onRegisterScreenSizeChange(blockKey: string, event: { callback: (data: {state: any, configuration: any, screenType: DataViewScreenSize}) => void }): void {
        const bpToUpdate = this._pageBlockProgressMap.get(blockKey);
        if (bpToUpdate) {
            bpToUpdate.registerScreenSizeChangeCallback = event.callback;
        }
    }

    emitEvent(event: any) {
        const eventData = {
            detail: event,
        };

        const customEvent = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(customEvent);
    }

    /**************************************************************************************/
    /*                            CPI & Server side calls.
    /**************************************************************************************/

    createNewPage(addonUUID: string, templateFileName: any, totalPages: number = 0): Observable<Page> {
        const baseUrl = this.getBaseUrl(addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/create_page?templateFileName=${templateFileName}&pageNum=${totalPages+1}`);
    }
    
    loadPageBuilder(addonUUID: string, pageKey: string, queryParameters: Params): void {
        //  If is't not edit mode get the page from the CPI side.
        const baseUrl = this.getBaseUrl(addonUUID);

        // Raise the PageLoad event to get all neccessary data.
        if (!this.layoutBuilderService.editMode) {
            this.raiseClientEventsForPageLoad(queryParameters, { PageKey: pageKey });
        } else { 
            // If is't edit mode get the data of the page from the Server side and then raise the PageLoad event to get all the neccessary data.
            // Get the page (sections and the blocks data) from the server.
            this.httpService.getHttpCall(`${baseUrl}/get_page_builder_data?key=${pageKey}`)
                .subscribe((serverResult: IPageBuilderData) => {
                    if (serverResult && serverResult.page && serverResult.availableBlocks && serverResult.pagesVariables) {
                        // Set the pages variables into the service variables.
                        this.setPagesVariables(serverResult.pagesVariables);
                        
                        // Load the page for edit mode.
                        this.notifyPageInEditorChange(serverResult.page, false, true);

                        // Here we send the page object (instead of the PageKey).
                        this.raiseClientEventsForPageLoad(queryParameters, { Page: this._pageInEditorSubject.getValue() });
                    }
            });
        }
    }

    unloadPageBuilder() {
        this.removeAllBlocks();
        this.notifyPageInEditorChange(null, true, true);
        this.notifyStateChange(null);
        this._availableBlocksDataSubject.next([]);
    }

    // restoreToLastPublish(addonUUID: string): Observable<Page> {
    //     const page = this._pageInEditorSubject.getValue();
    //     const baseUrl = this.getBaseUrl(addonUUID);

    //     return this.httpService.getHttpCall(`${baseUrl}/restore_to_last_publish?key=${page.Key}`);
    // }

    saveCurrentPage(addonUUID: string): void {
        const page: Page = this._pageInEditorSubject.getValue();
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        
        this.httpService.postHttpCall(`${baseUrl}/save_draft_page`, body).subscribe(savedPage => {
            this.notifyPageInEditorChange(savedPage, true, true);

            // Show message
            const data: PepSnackBarData = {
                title: this.translate.instant('MESSAGES.PAGE_SAVED'),
                content: '',
            }

            const config = this.pepSnackBarService.getSnackBarConfig({
                duration: 5000,
            });

            this.pepSnackBarService.openDefaultSnackBar(data, config);
        });
    }

    publishCurrentPage(addonUUID: string): void {
        const page: Page = this._pageInEditorSubject.getValue();
        const body = JSON.stringify(page);
        const baseUrl = this.getBaseUrl(addonUUID);
        this.httpService.postHttpCall(`${baseUrl}/publish_page`, body).subscribe(savedPage => {
            this.notifyPageInEditorChange(savedPage, true, true);

            // Show message
            const data: PepSnackBarData = {
                title: this.translate.instant('MESSAGES.PAGE_PUBLISHED'),
                content: '',
            }

            const config = this.pepSnackBarService.getSnackBarConfig({
                duration: 5000,
            });

            this.pepSnackBarService.openDefaultSnackBar(data, config);
        });
    }
}
