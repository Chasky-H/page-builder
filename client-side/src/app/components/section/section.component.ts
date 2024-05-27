import { Component, ElementRef, HostBinding, HostListener, Input, OnChanges, OnInit, QueryList, Renderer2, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragEnter, CdkDragExit, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { IEditor, PagesService, UiPageSizeType } from 'src/app/services/pages.service';
import { DataViewScreenSize, PageBlock, PageSectionColumn, PageSizeType, SplitType } from '@pepperi-addons/papi-sdk';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PageBlockView } from 'shared';
import { BaseDestroyerComponent } from '../base/base-destroyer.component';

@Component({
    selector: 'section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss', './section.component.theme.scss']
})
export class SectionComponent extends BaseDestroyerComponent implements OnInit {
    @ViewChild('sectionContainer') sectionContainerRef: ElementRef;
    @ViewChildren('columnsWrapper') columnsElementRef: QueryList<ElementRef>;

    @Input() key: string;
    @Input() name: string;

    private _editable = false;
    @Input()
    set editable(value: boolean) {
        this._editable = value;
        this.refreshSplit();
    }
    get editable(): boolean {
        return this._editable;
    }

    private _screenSize: PepScreenSizeType;
    @Input()
    set screenSize(value: PepScreenSizeType) {
        this._screenSize = value;
        this.refreshSplit();
        this.setScreenType();
    }
    get screenSize(): PepScreenSizeType {
        return this._screenSize;
    }

    private _split: SplitType = null;
    @Input()
    set split(value: SplitType) {
        this._split = value;
        this.refreshSplit();
    }
    get split(): SplitType {
        return this._split;
    }

    private _height: number = null;
    @Input()
    set height(value: number) {
        this._height = value;
        this.setStyleHeight();
    }
    get height(): number {
        return this._height;
    }

    private _collapseOnTablet = false;
    @Input()
    set collapseOnTablet(value: boolean) {
        this._collapseOnTablet = value;
        this.pepScreenSizeToFlipToVertical = value ? PepScreenSizeType.MD : PepScreenSizeType.SM;
        this.refreshSplit();
    }
    get collapseOnTablet(): boolean {
        return this._collapseOnTablet;
    }

    private _columns = [];
    @Input()
    set columns(value: Array<PageSectionColumn>) {
        this._columns = value || [];
    }
    get columns(): Array<PageSectionColumn> {
        return this._columns;
    }
    
    private _hideIn: DataViewScreenSize[];
    @Input()
    set hideIn(value: DataViewScreenSize[]) {
        this._hideIn = value;
        this.setIfHideForCurrentScreenType();
    }
    get hideIn(): DataViewScreenSize[] {
        return this._hideIn;
    }

    @Input() columnsGap: UiPageSizeType;
    @Input() sectionsColumnsDropList = [];
    
    private _pageBlockViewsMap = new Map<string, PageBlockView>();
    @Input()
    set pageBlockViewsMap(value: Map<string, PageBlockView>) {
        this._pageBlockViewsMap = value || new Map<string, PageBlockView>();
    }
    get pageBlockViewsMap(): Map<string, PageBlockView> {
        return this._pageBlockViewsMap;
    }

    @HostBinding('style.max-height')
    styleMaxHeight = 'unset';

    @HostBinding('style.height')
    styleHeight = 'unset';
    
    PepScreenSizeType = PepScreenSizeType;
    sectionColumnKeyPrefix = '';
    
    isMainEditorState = false;
    isEditing = false;
    selectedSectionKey = '';
    selectedBlockKey = '';
    
    containsBlocks = false;
    shouldSetDefaultHeight = false;
    pepScreenSizeToFlipToVertical = PepScreenSizeType.SM;
    screenType: DataViewScreenSize;
    hideForCurrentScreenType = false;
    draggingBlockKey: string = '';
    draggingSectionKey: string = '';
    hoverState = false;

    constructor(
        private renderer: Renderer2,
        // private translate: TranslateService,
        private pagesService: PagesService
    ) { 
        super();
    }

    private calculateIfSectionContainsBlocks() {
        this.containsBlocks = this.columns.some(column => column.BlockContainer);

        if (this.editable) {
            this.shouldSetDefaultHeight = !this.containsBlocks;
        }
    }

    private setScreenType() {
        this.screenType = this.pagesService.getScreenType(this.screenSize);
        this.setIfHideForCurrentScreenType();
        this.setStyleHeight();
    }

    private setIfHideForCurrentScreenType(): void {
        this.hideForCurrentScreenType = this.pagesService.getIsHidden(this.hideIn, this.screenType);
    }
    
    private getCssSplitString() {
        switch (this.split) {
            case '1/2 1/2':
                return '1fr 1fr';
            case '1/2 1/4 1/4':
                return '2fr 1fr 1fr';
            case '1/3 1/3 1/3':
                return '1fr 1fr 1fr';
            case '1/3 2/3':
                return '1fr 2fr';
            case '1/4 1/2 1/4':
                return '1fr 2fr 1fr';
            case '1/4 1/4 1/2':
                return '1fr 1fr 2fr';
            case '1/4 1/4 1/4 1/4':
                return '1fr 1fr 1fr 1fr';
            case '1/4 3/4':
                return '1fr 3fr';
            case '2/3 1/3':
                return '2fr 1fr';
            case '3/4 1/4':
                return '3fr 1fr';
            default: // For one column.
                return '1fr';
        }
    }

    private refreshSplit() {
        setTimeout(() => {
            if (this.sectionContainerRef) {
                let cssSplitString = this.getCssSplitString();
                
                // Go for all the columns in the columnsWrapper
                this.columnsElementRef.toArray().map((section, sectionIndex) => {
                    // Horizontal (true) for large screens, false for small screens.
                    const isHorizontalView = this.screenSize <= this.pepScreenSizeToFlipToVertical;

                    if (isHorizontalView) {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'column');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', 'unset');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', cssSplitString);
                    } else {
                        this.renderer.setStyle(section.nativeElement, 'grid-auto-flow', 'row');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-columns', 'unset');
                        this.renderer.setStyle(section.nativeElement, 'grid-template-rows', 'unset');//cssSplitString);
                        
                        // In runtime (or preview mode).
                        if (!this.editable) {
                            const cssSplitArray = cssSplitString.split(' ');
                            
                            // If there are some hidden columns change the column width to 0 (for cut the spacing in the grid-template-rows).
                            this.columns.forEach((column, index) => {
                                if (!column.BlockContainer) {
                                    cssSplitArray[index] = '0';
                                }
                            });
                            this.renderer.setStyle(section.nativeElement, 'grid-template-rows', 'auto');
                            //this.renderer.setStyle(section.nativeElement, 'grid-template-rows', cssSplitArray.join(' '));
                        }
                    }
                });
            }
        }, 0);
    }

    private setStyleHeight() {
        if (this.height > 0 && this.screenType !== 'Phablet') {
            this.styleHeight = this.styleMaxHeight = `${this.height}px`;
        } else {
            this.styleHeight = this.styleMaxHeight = 'unset';
        }
    }

    getIsDragging(): boolean {
        return this.draggingBlockKey.length > 0 && this.draggingSectionKey.length > 0;
    }

    getIsHidden(hideIn: DataViewScreenSize[], currentScreenType: DataViewScreenSize) {
        return this.pagesService.getIsHidden(hideIn, currentScreenType);
    }

    ngOnInit(): void {
        this.refreshSplit();

        // Just to calculate if sections contains blocks
        this.pagesService.sectionsChange$.pipe(this.getDestroyer()).subscribe(res => {
            this.calculateIfSectionContainsBlocks();
        });

        if (this.editable) {
            this.pagesService.editorChange$.pipe(this.getDestroyer()).subscribe((editor: IEditor) => {
                this.isMainEditorState = editor && editor.type === 'page-builder';
                this.isEditing = editor && editor.type === 'section' && editor.id === this.key;
                this.selectedSectionKey = editor && editor.type === 'section' ? editor.id : '';
                this.selectedBlockKey = editor && editor.type === 'block' ? editor.id : '';
            });
            
            this.pagesService.draggingBlockKey.pipe(this.getDestroyer()).subscribe((draggingBlockKey: string) => {
                this.draggingBlockKey = draggingBlockKey;

                if (draggingBlockKey === '') {
                    this.calculateIfSectionContainsBlocks();
                } else {
                    // If there is only one block in the section and now it's this block that the user is dragging.
                    const blocksLength = this.columns.filter(column => column.BlockContainer).length;
                    if (blocksLength === 1 && this.columns.find(c => c.BlockContainer?.BlockKey === this.draggingBlockKey)) {
                        this.shouldSetDefaultHeight = true;
                    }
                }

            });

            this.pagesService.draggingSectionKey.pipe(this.getDestroyer()).subscribe((draggingSectionKey: string) => {
                this.draggingSectionKey = draggingSectionKey;
            });
        }

        this.sectionColumnKeyPrefix = this.pagesService.getSectionColumnKey(this.key);
    }

    onEditSectionClick() {
        this.pagesService.navigateToEditor('section', this.key);
    }

    onRemoveSectionClick() {
        this.pagesService.removeSection(this.key);
    }

    onHideSectionChange(hideIn: DataViewScreenSize[]) {
        this.pagesService.hideSection(this.key, hideIn);
    }

    onHideInMenuOpened() {
        this.hoverState = true;
    }

    onHideInMenuClosed() {
        this.hoverState = false;
    }

    onBlockDropped(event: CdkDragDrop<any[]>) {
        this.pagesService.onBlockDropped(event, this.key);
    }

    canDropPredicate(columnIndex: number) {
        return (drag: CdkDrag, drop: CdkDropList) => {
            const res = !this.pagesService.doesColumnContainBlock(this.key, columnIndex);
            return res;
        };
    }

    onDragStart(event: CdkDragStart) {
        this.pagesService.onSectionDragStart(event);
    }

    onDragEnd(event: CdkDragEnd) {
        this.pagesService.onSectionDragEnd(event);
    }

    onSectionBlockDragExited(event: CdkDragExit) {
        // TODO: Remove this.
        // // If the block is exit from his container and it's the only block in this section.
        // if (this.containsBlocks) {
        //     const blocksLength = this.columns.filter(column => column.BlockContainer).length;

        //     if (blocksLength === 1) {
        //         this.containsBlocks = false;
        //         this.shouldSetDefaultHeight = true;
        //     }
        // }
    }

    onSectionBlockDragEntered(event: CdkDragEnter) {
        // TODO: Remove this.
        // // Only in case that the block entered back to his container and it's the only block in this section.
        // if (event.container.id === event.item.dropContainer.id) {
        //     if (!this.containsBlocks) {
        //         this.containsBlocks = true;
        //     }
        // }
    }
}
