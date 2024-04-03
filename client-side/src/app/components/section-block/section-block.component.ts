import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IBlockProgress, IPageBlockHostObject, PagesService } from '../../services/pages.service';
import { DataViewScreenSize, PageSection } from '@pepperi-addons/papi-sdk';
import { PepRemoteLoaderOptions } from '@pepperi-addons/ngx-lib/remote-loader';
import { BaseDestroyerDirective } from '@pepperi-addons/ngx-lib';
import { IPageState, IPageView, PageBlockView } from 'shared';
import { PepLayoutBuilderService } from "@pepperi-addons/ngx-composite-lib/layout-builder";
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'section-block',
    templateUrl: './section-block.component.html',
    styleUrls: ['./section-block.component.scss']
})
export class SectionBlockComponent extends BaseDestroyerDirective implements OnInit {
    
    @Input() blockKey: string;

    private _pageBlockView: PageBlockView;
    // @Input()
    // set pageBlockView(value: PageBlockView) {
    //     this._pageBlockView = value;
    //     this.setRemotePathOptions();
    //     this.setHostObject();

    //     // Set time out to be after the _hostObject
    //     setTimeout(() => {
    //         this.callStateChangeCallback();
    //     }, 0);
    // }
    // get pageBlockView(): PageBlockView {
    //     return this._pageBlockView;
    // }

    private _screenType: DataViewScreenSize;
    @Input()
    set screenType(value: DataViewScreenSize) {
        const isNotFirstTime = this._screenType?.length > 0;
        this._screenType = value;

        if (isNotFirstTime) {
            this.setConfigurationOnScreenSizeChanged();
        }
    }
    get screenType(): DataViewScreenSize {
        return this._screenType;
    }

    private _hostObject: IPageBlockHostObject;
    get hostObject() {
        return this._hostObject;
    }

    private _state = {};
    protected remoteLoaderOptions: PepRemoteLoaderOptions;

    onBlockHostEventsCallback: (event: CustomEvent) => void;

    private _pageBlockViewsMap = new Map<string, PageBlockView>();
    get pageBlockViewsMap(): ReadonlyMap<string, PageBlockView> {
        return this._pageBlockViewsMap;
    }

    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);


    constructor(
        private pagesService: PagesService,
        private layoutBuilderService: PepLayoutBuilderService
    ) {
        super();

        this.onBlockHostEventsCallback = (event: CustomEvent) => {
            this.onBlockHostEvents(event.detail);
        }
    }
    
    private setRemotePathOptions() {
        if (this._pageBlockView && !this.remoteLoaderOptions) {
            const options = this.pagesService.getBlocksRemoteLoaderOptions(this._pageBlockView.RelationData.Name, this._pageBlockView.RelationData.AddonUUID);
            this.remoteLoaderOptions = options;
        }
    }

    private setPageBlockView(value: PageBlockView) {
        this._pageBlockView = value;
        this.setRemotePathOptions();
        this.setHostObject();

        // Set time out to be after the _hostObject
        setTimeout(() => {
            this.callStateChangeCallback();
        }, 0);
    }

    private setConfigurationOnScreenSizeChanged() {
        if (this._pageBlockView) {
            const bp = this.pagesService.pageBlockProgressMap.get(this._pageBlockView.Key);
    
            // If this is new code (handle screen size change with callback function and not change the host object).
            if (bp.registerScreenSizeChangeCallback) {
                const data: { state: any, configuration: any, screenType: DataViewScreenSize } = {
                    state: this._state,
                    configuration: this.pagesService.getMergedConfigurationData(this._pageBlockView),
                    screenType: this.screenType
                };
    
                bp.registerScreenSizeChangeCallback(data);
            } else {
                // This is for support old blocks.
                this.setHostObject();
            }
        }
    }

    private setHostObject(): void {
        if (this._pageBlockView) {
            this._hostObject = this.pagesService.getBlockHostObject(this._pageBlockView);
        }
    }

    private callStateChangeCallback(onBlockChange = false): void {
        if (this._pageBlockView) {
            const bp = this.pagesService.pageBlockProgressMap.get(this._pageBlockView.Key);
                        
            if (bp && bp.registerStateChangeCallback && bp.blockLastChanges) {
                // Update pageBlockView
                this._pageBlockView = bp.blockLastChanges;
    
                const data: { state: any, configuration: any } = {
                    state: this._state,
                    configuration: this.pagesService.getMergedConfigurationData(this._pageBlockView) // bp.blockLastChanges.Configuration
                };
        
                bp.registerStateChangeCallback(data);
            } else {
                // Only if block change then set the hostObject.
                if (onBlockChange) {
                    // Update pageBlockView
                    this._pageBlockView = bp.block;
                    // This is for support old blocks.
                    this.setHostObject();
                }
            }
        }
    }
    private isBlockShouldBeHidden(blockKey: string): boolean {
        let res = false;

        if (!this.layoutBuilderService.editMode) {
            let blockFound = false;
            const sections = this._sectionsSubject.getValue(); 

            for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
                const section = sections[sectionIndex];
                
                for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                    const column = section.Columns[columnIndex];
                    
                    if (column.BlockContainer?.BlockKey === blockKey) {
                        // Check if the block should be hidden
                        const sectionShouldBeHidden = this.layoutBuilderService.getIsHidden(section.Hide, this.screenType);
                        const blockShouldBeHidden = this.layoutBuilderService.getIsHidden(column.BlockContainer.Hide, this.screenType);
    
                        res = (sectionShouldBeHidden || blockShouldBeHidden);
                        blockFound = true;
                        break;
                    }
                }
    
                if (blockFound) {
                    break;
                }
            }
        }

        return res;
    }

    ngOnInit(): void {
        // When block change call to his callback if declared, Else override the host object.
        this.pagesService.pageBlockChange$.pipe(this.getDestroyer()).subscribe((pageBlockKey: string) => {
            if (this._pageBlockView?.Key === pageBlockKey) {
                this.callStateChangeCallback(true);
            }
        });

        // Update the changed state
        this.pagesService.pageStateChange$.pipe(this.getDestroyer()).subscribe((state: IPageState) => {
            if (this._pageBlockView && state?.BlocksState.hasOwnProperty(this._pageBlockView.Key)) {
                this._state = state.BlocksState[this._pageBlockView.Key];
            }
        });

        this.pagesService.pageViewDataChange$.pipe(this.getDestroyer()).subscribe((page: IPageView) => {
            this._sectionsSubject.next(page.Layout?.Sections || []);
        });

        this.pagesService.pageBlockProgressMapChange$.pipe(this.getDestroyer()).subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
            debugger;
            // Clear the blocks map and set it again.
            const pageBlockViewsMap = new Map<string, PageBlockView>();
            // const remoteEntriesMap = new Map<string, boolean>();
            const pbRelationsNames = new Map<string, boolean>();

            blocksProgress.forEach(bp => {
                // Only if the block should not be hidden
                if (!this.isBlockShouldBeHidden(bp.block.Key)) {
                    // Check that there is no other block with the same relation name that need to load 
                    // (cause the module deferation throw error when we try to load two blocks from the same relation).
                    if (bp.loaded || !pbRelationsNames.has(bp.block.RelationData.Name)) {
                        
                        // Add to the map only relations that not added yet.
                        if (!bp.loaded) {
                            pbRelationsNames.set(bp.block.RelationData.Name, true);
                        }

                        pageBlockViewsMap.set(bp.block.Key, bp.block);
                    }
                }
            });

            this._pageBlockViewsMap = pageBlockViewsMap;
            this.setPageBlockView(pageBlockViewsMap.get(this.blockKey));
        });
    }

    onBlockHostEvents(event: any) {
        // Implement blocks events.
        switch(event.action) {
            case 'state-change':
                // In runtime (or preview mode).
                if (!this.layoutBuilderService.editableState) {
                    this.pagesService.onBlockStateChange(this._pageBlockView?.Key, event);
                }
                break;
            case 'button-click':
                // In runtime (or preview mode).
                if (!this.layoutBuilderService.editableState) {
                    this.pagesService.onBlockButtonClick(this._pageBlockView?.Key, event);
                }
                break;
            case 'register-state-change':
                this.pagesService.onRegisterStateChange(this._pageBlockView?.Key, event);
                break;
            case 'register-screen-size-change':
                this.pagesService.onRegisterScreenSizeChange(this._pageBlockView?.Key, event);
                break;
            case 'emit-event':
                this.pagesService.emitEvent(event);
                break;
        }
    }

    onBlockLoad(event: any) {
        this.pagesService.updateBlockLoaded(this._pageBlockView?.Key);
    }
}
