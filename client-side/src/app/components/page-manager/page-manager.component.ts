import { Component, ElementRef, OnInit, Renderer2, ViewChild, ViewContainerRef } from "@angular/core";
import { BaseDestroyerDirective, PepAddonService, PepLayoutService } from '@pepperi-addons/ngx-lib';
import { TranslateService } from '@ngx-translate/core';
import { DataViewScreenSize, Page } from '@pepperi-addons/papi-sdk';
import { PagesService, IBlockEditor } from '../../services/pages.service';
// import { DIMXService } from '../../services/dimx.service';
import { NavigationService } from '../../services/navigation.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
import { PepDialogActionButton, PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { IEditor, IPepLayoutBlockAddedEvent, IPepLayoutBlockConfig, PepLayoutBuilderService } from "@pepperi-addons/ngx-composite-lib/layout-builder";
import { IAvailableBlockData } from "shared";
import { IPepDraggableItem } from "@pepperi-addons/ngx-lib/draggable-items";

@Component({
    selector: 'page-manager',
    templateUrl: './page-manager.component.html',
    styleUrls: ['./page-manager.component.scss']
})
export class PageManagerComponent extends BaseDestroyerDirective implements OnInit {
    @ViewChild('pageBuilderWrapper', { static: true }) pageBuilderWrapper: ElementRef;
    
    readonly MIN_PERCENTAGE_TO_SHOW_LIMIT = 80;

    protected layoutEditorTitle: string;
    protected currentBlockEditor: IBlockEditor;
    protected pageSizeLimitInPercentage: number = 0;
    protected isOverPageSizeLimit = false;
    protected currentPage: Page;

    // availableBlocksData: IAvailableBlockData[] = [];
    protected availableBlocksForDrag: Array<IPepDraggableItem> = [];
    
    protected onBlockEditorHostEventsCallback: (event: CustomEvent) => void;

    protected blocksLayoutConfig: IPepLayoutBlockConfig = {
        navigateToEditorAfterBlockAdded: true,
        blocksLimitNumber: this.pagesService.BLOCKS_NUMBER_LIMITATION_OBJECT.value,
        getBlockTitle: this.getBlockTitle.bind(this),
    }
    
    constructor(
        private translate: TranslateService,
        private dialogService: PepDialogService,
        private pepAddonService: PepAddonService,
        private pagesService: PagesService,
        private utilitiesService: UtilitiesService,
        protected layoutBuilderService: PepLayoutBuilderService,
        protected navigationService: NavigationService,
    ) {
        super();
        this.pepAddonService.setShellRouterData({ showSidebar: false, addPadding: false});
        this.onBlockEditorHostEventsCallback = (event: CustomEvent) => {
            this.onBlockEditorHostEvents(event.detail);
        }
    }

    private getBlockTitle(blockKey: string): string {
        return this.pagesService.getBlockTitle(blockKey);
    }

    private setCurrentBlockEditor(blockKey: string): void {
        this.currentBlockEditor = this.pagesService.getBlockEditor(blockKey);
    }
    
    private subscribeEvents() {
        // When block change update the editor cause it can be changed.
        this.pagesService.pageBlockChange$.pipe(this.getDestroyer()).subscribe((pageBlockKey: string) => {
            if (this.currentBlockEditor?.id === pageBlockKey) {
                // Don't update the editor cause if the user is still editing the focus field will be blur and the entered data will be lose.
                // Update cause if this in comment the editor dont update after changes like reset etc.
                this.setCurrentBlockEditor(pageBlockKey);
            }
        });

        // For update the page data
        this.pagesService.pageDataForEditorChange$.pipe(this.getDestroyer()).subscribe((page: Page) => {
            if (page) {
                this.currentPage = page;
                this.layoutEditorTitle = page.Name;

                const pageSize = this.utilitiesService.getObjectSize(page, 'kb');
                this.pageSizeLimitInPercentage = pageSize * 100 / this.pagesService.PAGE_SIZE_LIMITATION_OBJECT.value;
                this.isOverPageSizeLimit = pageSize >= this.pagesService.PAGE_SIZE_LIMITATION_OBJECT.value;
            }
        });

        this.pagesService.availableBlocksDataLoadedSubject$.pipe(this.getDestroyer()).subscribe((availableBlocksData: IAvailableBlockData[]) => {
            // TODO: For now we don't check if the relation is available or not. 
            // availableBlocksData = availableBlocksData.filter(ab => ab.RelationAvailable);
            
            this.availableBlocksForDrag = availableBlocksData.map(abd => {
                return {
                    title: abd.RelationTitle || abd.RelationName,
                    disabled: false,
                    data: { key: abd.RelationAddonUUID, availableBlockData: abd }
                }
            });
        });

        this.pagesService.blocksNumberLimitationChange$.pipe(this.getDestroyer()).subscribe((blocksNumberLimitation: number) => {
            this.blocksLayoutConfig = {
                ...this.blocksLayoutConfig, 
                blocksLimitNumber: blocksNumberLimitation
            };
        });
    }

    get pageSizeString(): string {
        return `${this.pageSizeLimitInPercentage.toFixed(1)}%`;
    }

    ngOnInit() {
        this.subscribeEvents();
    }

    onPageNameChange(pageName: string) {
        this.layoutEditorTitle = pageName;
    }

    onBlockEditorHostEvents(event: any) {
        // Implement editors events.
        switch(event.action) {
            case 'set-configuration':
                this.pagesService.onBlockEditorSetConfiguration(this.currentBlockEditor.id, event.configuration);
                break;
            case 'set-configuration-field':
                this.pagesService.onBlockEditorConfigurationField(this.currentBlockEditor.id, event.key, event.value);
                break;
            case 'set-page-configuration':
                this.pagesService.onBlockEditorSetPageConfiguration(this.currentBlockEditor.id, event.pageConfiguration);
                break;
        }
    }

    onBackClick() {
        if (this.pagesService.doesCurrentPageHasChanges()) {
            const title = this.translate.instant('MESSAGES.TITLE_NOTICE');
            const content = this.translate.instant('MESSAGES.CHANGES_ARE_NOT_SAVED');
            let dataMsg: PepDialogData;
            let actionButtons: PepDialogActionButton[];
            actionButtons = [
                new PepDialogActionButton(
                    this.translate.instant('ACTIONS.CANCEL'),
                    '',
                    () => { /* Do nothing */ }),
                new PepDialogActionButton(
                    this.translate.instant('ACTIONS.LEAVE_PAGE'),
                    'strong',
                    () => this.navigationService.back())
            ];
            dataMsg = new PepDialogData({
                title,
                actionsType: 'custom',
                content: content,
                actionButtons
            });
            this.dialogService.openDefaultDialog(dataMsg).afterClosed()
                .subscribe((isActionButtonClicked) => {
                    // If user pressed on cancel (X button) or clicked outside
                    if (!isActionButtonClicked) {
                        // Do nothing.
                    }
            });
        } else {
            this.navigationService.back();
        }
    }

    onEditorChanged(editor: IEditor) {
        this.currentBlockEditor = null;

        // Raise event to let the user set the block editor in the UI.
        if (editor.type === 'block') {
            this.setCurrentBlockEditor(editor.id);
        }
    }

    onScreenTypeChange(screenType: DataViewScreenSize) {
        if (this.currentBlockEditor?.id) {
            this.setCurrentBlockEditor(this.currentBlockEditor.id);
        }
    }

    onBlockAdded(blockAddedEvent: IPepLayoutBlockAddedEvent) {
        this.pagesService.addBlock(blockAddedEvent);
    }

    onBlocksRemoved(blocksKeys: string[]) {
        this.pagesService.removePageBlocks(blocksKeys);
    }

    onSaveClick() {
        this.pagesService.saveCurrentPage(this.navigationService.addonUUID);
    }

    onPublishClick() {
        this.pagesService.publishCurrentPage(this.navigationService.addonUUID);
    }
}