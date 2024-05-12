import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { CdkDragDrop  } from '@angular/cdk/drag-drop';
import { IBlockProgress, PagesService } from '../../services/pages.service';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { DataViewScreenSize, Page, PageBlock, PageSection, PageSizeType } from '@pepperi-addons/papi-sdk';
import { NavigationService } from 'src/app/services/navigation.service';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { IPageView, PageBlockView } from 'shared';
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
    @ViewChild('sectionsCont', { static: true }) sectionsContainer: ElementRef;

    @Input() editMode: boolean = false;
    @Input() sectionsColumnsDropList = [];
    
    // For loading the page from the client apps.
    private _hostObject: IPageBuilderHostObject;
    @Input()
    set hostObject(value: IPageBuilderHostObject) {
        this._hostObject = value;
    }
    get hostObject(): IPageBuilderHostObject {
        return this._hostObject;
    }

    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
        this.screenType = this.pagesService.getScreenType(value);
        this.pagesService.setScreenWidth(this.screenType);
    }
    get screenSize(): PepScreenSizeType {
        return this._screenSize;
    }

    @HostBinding('style.padding-inline')
    paddingInline = '0';

    @HostBinding('style.padding-top')
    paddingTop = '0';
    @HostBinding('style.padding-bottom')
    paddingBottom = '0';

    sectionsGap: PageSizeType | 'none';
    columnsGap: PageSizeType | 'none';

    screenType: DataViewScreenSize;

    private _sectionsSubject: BehaviorSubject<PageSection[]> = new BehaviorSubject<PageSection[]>([]);
    get sections$(): Observable<PageSection[]> {
        return this._sectionsSubject.asObservable();
    }

    private _pageBlockViewsMap = new Map<string, PageBlockView>();
    get pageBlockViewsMap(): ReadonlyMap<string, PageBlockView> {
        return this._pageBlockViewsMap;
    }

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private navigationService: NavigationService,
        private utilitiesService: PepUtilitiesService,
        private layoutService: PepLayoutService,
        private pagesService: PagesService
    ) {
        super();
    }

    private convertPageSizeType(size: PageSizeType | 'none') {
        let res;

        if (size === 'lg') {
            res = '2rem';
        } else if (size === 'md') {
            res = '1rem';
        } else if (size === 'sm') {
            res = '0.5rem';
        } else {
            res = '0';
        }

        return res;
    }

    private setPageDataProperties(pageView: IPageView) {
        if (pageView && this.sectionsContainer?.nativeElement) {
            let maxWidth = coerceNumberProperty(pageView.Layout.MaxWidth, 0);
            const maxWidthToSet = maxWidth === 0 ? 'unset' : `${maxWidth}px`;
            this.renderer.setStyle(this.sectionsContainer.nativeElement, 'max-width', maxWidthToSet);
          
            this.sectionsGap = pageView.Layout.SectionsGap || 'md';
            this.columnsGap = pageView.Layout.ColumnsGap || 'md';

            this.paddingInline = this.convertPageSizeType(pageView.Layout.HorizontalSpacing || 'md');
            this.paddingBottom = this.paddingTop = this.convertPageSizeType(pageView.Layout.VerticalSpacing || 'md');
        }
    }

    private isBlockShouldBeHidden(blockKey: string): boolean {
        let res = false;

        if (!this.editMode) {
            let blockFound = false;
            const sections = this._sectionsSubject.getValue();

            for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
                const section = sections[sectionIndex];
                
                for (let columnIndex = 0; columnIndex < section.Columns.length; columnIndex++) {
                    const column = section.Columns[columnIndex];
                    
                    if (column.BlockContainer?.BlockKey === blockKey) {
                        // Check if the block should be hidden
                        const sectionShouldBeHidden = this.pagesService.getIsHidden(section.Hide, this.screenType);
                        const blockShouldBeHidden = this.pagesService.getIsHidden(column.BlockContainer.Hide, this.screenType);
    
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
            this.pagesService.loadPageBuilder(addonUUID, pageKey, this.editMode, queryParams);

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
                this.setPageDataProperties(pageView);
            });
        } else {
            console.log(`pageKey in not valid: ${pageKey}`);
        }
    }

    ngOnDestroy() {
        this.pagesService.unloadPageBuilder();
        this.navigationService.initRouterToRoot();
    }

    onSectionDropped(event: CdkDragDrop<any[]>) {
        this.pagesService.onSectionDropped(event);
    }

    getSectionsTemplateRows() {
        let templateRows = '';
        let fillHeightCount = 0;
        this.sections$.pipe(this.getDestroyer()).subscribe((sections: PageSection[]) => {    
               if(sections?.length){
                    sections.forEach(sec => {
                        if(sec.FillHeight === true){
                            fillHeightCount++;
                            templateRows += ' auto';
                        }
                        else {
                            templateRows += ' min-content';
                        }
                    });
                    
                    //if all are fill height should return 1fr for all
                    //if not should return auto for fill height and min content for none
                    return templateRows;
               } 
        });

        return templateRows;
    }
}
