import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { BehaviorSubject } from 'rxjs';
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { DataViewScreenSize, Page, PageBlock, PageSection, PageSizeType } from '@pepperi-addons/papi-sdk';
import { NavigationService } from 'src/app/services/navigation.service';
import { PepLayoutBuilderService } from '@pepperi-addons/ngx-composite-lib/layout-builder';
import { IPageView, PageBlockView } from 'shared';
import { IBlockProgress, PagesService } from '../../services/pages.service';
import { BaseDestroyerComponent } from '../base/base-destroyer.component';

export interface IPageBuilderHostObject {
    pageKey: string;
    pageParams: any;
    offline: boolean;
}

@Component({
    selector: 'page-builder-internal',
    templateUrl: './page-builder-internal.component.html',
    styleUrls: ['./page-builder-internal.component.scss']
})
export class PageBuilderInternalComponent extends BaseDestroyerComponent implements OnInit, OnDestroy {
    // For loading the page from the client apps.
    private _hostObject: IPageBuilderHostObject;
    @Input()
    set hostObject(value: IPageBuilderHostObject) {
        this._hostObject = value;
    }
    get hostObject(): IPageBuilderHostObject {
        return this._hostObject;
    }

    private _pageBlockViewsMap = new Map<string, PageBlockView>();
    get pageBlockViewsMap(): ReadonlyMap<string, PageBlockView> {
        return this._pageBlockViewsMap;
    }

    private _pageView: IPageView;
    protected showSkeleton = true;
    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    // get sections$(): Observable<PageSection[]> {
    //     return this._sectionsSubject.asObservable();
    // }

    screenType: DataViewScreenSize;

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private navigationService: NavigationService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private layoutBuilderService: PepLayoutBuilderService,
        private pagesService: PagesService
    ) {
        super();
    }

    private isBlockShouldBeHidden(blockKey: string): boolean {
        let res = false;

        if (!this.layoutBuilderService.isEditMode) {
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

    ngOnInit() {
        const addonUUID = this.navigationService.addonUUID;
        const pageKey = this.hostObject?.pageKey || this.route.snapshot.data['page_key'] || this.route?.snapshot?.params['page_key'] || '';
        this.pagesService.isOffline =  this.hostObject?.offline || false;

        console.log('pageKey - ' + pageKey);
        if (pageKey.length > 0) {
            // When running slug in runtime mode the route?.snapshot?.queryParams is empty. (Need to fix this somehow).
            // const queryParams = this.hostObject?.pageParams || this.route?.snapshot?.queryParams;
            const urlParams = this.navigationService.getQueryParamsAsObject();
            const queryParams = this.hostObject?.pageParams || urlParams;
            this.pagesService.loadPageBuilder(addonUUID, pageKey, this.layoutBuilderService.isEditMode, queryParams);

            this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
                this.screenSize = size;
            });

            this.pagesService.sectionsChange$.pipe(this.getDestroyer()).subscribe((sections: PageSection[]) => {
                this._sectionsSubject.next(sections);
            });

            this.pagesService.pageBlockProgressMapChange$.pipe(this.getDestroyer()).subscribe((blocksProgress: ReadonlyMap<string, IBlockProgress>) => {
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
            });

            this.pagesService.pageViewDataChange$.pipe(this.getDestroyer()).subscribe((pageView: IPageView) => {
                this._pageView = pageView;
                this.setPageDataProperties(this._pageView);
            });

            
        } else {
            console.log(`pageKey in not valid: ${pageKey}`);
        }
    }

    ngOnDestroy() {
        this.pagesService.unloadPageBuilder();
        this.navigationService.initRouterToRoot();
    }

    onScreenTypeChange(screenType: DataViewScreenSize) {
        this.screenType = screenType;
    }
}
