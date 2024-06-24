import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IPageBlockHostObject, PagesService } from '../../services/pages.service';
import { DataViewScreenSize } from '@pepperi-addons/papi-sdk';
import { PepRemoteLoaderOptions } from '@pepperi-addons/ngx-lib/remote-loader';
import { BaseDestroyerDirective } from '@pepperi-addons/ngx-lib';
import { IPageState, PageBlockView } from 'shared';
import { PepLayoutBuilderService } from "@pepperi-addons/ngx-composite-lib/layout-builder";

@Component({
    selector: 'page-block',
    templateUrl: './page-block.component.html',
    styleUrls: ['./page-block.component.scss']
})
export class PageBlockComponent extends BaseDestroyerDirective implements OnInit {
    
    private _pageBlockView: PageBlockView;
    @Input()
    set pageBlockView(value: PageBlockView) {
        this._pageBlockView = value;
        this.setRemotePathOptions();
        this.setHostObject();

        // Set time out to be after the _hostObject
        setTimeout(() => {
            this.callStateChangeCallback();
        }, 0);
    }
    get pageBlockView(): PageBlockView {
        return this._pageBlockView;
    }

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
        if (!this.remoteLoaderOptions) {
            const options = this.pagesService.getBlocksRemoteLoaderOptions(this.pageBlockView.RelationData.Name, this.pageBlockView.RelationData.AddonUUID);
            this.remoteLoaderOptions = options;
        }
    }

    private setConfigurationOnScreenSizeChanged() {
        const bp = this.pagesService.pageBlockProgressMap.get(this.pageBlockView.Key);

        // If this is new code (handle screen size change with callback function and not change the host object).
        if (bp.registerScreenSizeChangeCallback) {
            const data: { state: any, configuration: any, screenType: DataViewScreenSize } = {
                state: this._state,
                configuration: this.pagesService.getMergedConfigurationData(this.pageBlockView),
                screenType: this.screenType
            };

            bp.registerScreenSizeChangeCallback(data);
        } else {
            // This is for support old blocks.
            this.setHostObject();
        }
    }

    private setHostObject(): void {
        this._hostObject = this.pagesService.getBlockHostObject(this.pageBlockView);
    }

    private callStateChangeCallback(onBlockChange = false): void {
        const bp = this.pagesService.pageBlockProgressMap.get(this.pageBlockView.Key);
                    
        if (bp && bp.registerStateChangeCallback && bp.blockLastChanges) {
            // Update pageBlockView
            this._pageBlockView = bp.blockLastChanges;

            const data: { state: any, configuration: any } = {
                state: this._state,
                configuration: this.pagesService.getMergedConfigurationData(this.pageBlockView) // bp.blockLastChanges.Configuration
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

    ngOnInit(): void {
        // When block change call to his callback if declared, Else override the host object.
        this.pagesService.pageBlockChange$.pipe(this.getDestroyer()).subscribe((pageBlockKey: string) => {
            if (this.pageBlockView.Key === pageBlockKey) {
                this.callStateChangeCallback(true);
            }
        });

        // Update the changed state
        this.pagesService.pageStateChange$.pipe(this.getDestroyer()).subscribe((state: IPageState) => {
            if (state?.BlocksState.hasOwnProperty(this.pageBlockView.Key)) {
                this._state = state.BlocksState[this.pageBlockView.Key];
            }
        });
    }

    onBlockHostEvents(event: any) {
        // Implement blocks events.
        switch(event.action) {
            case 'state-change':
                // In runtime (or preview mode).
                if (!this.layoutBuilderService.editableState) {
                    this.pagesService.onBlockStateChange(this.pageBlockView.Key, event);
                }
                break;
            case 'button-click':
                // In runtime (or preview mode).
                if (!this.layoutBuilderService.editableState) {
                    this.pagesService.onBlockButtonClick(this.pageBlockView.Key, event);
                }
                break;
            case 'register-state-change':
                this.pagesService.onRegisterStateChange(this.pageBlockView.Key, event);
                break;
            case 'register-screen-size-change':
                this.pagesService.onRegisterScreenSizeChange(this.pageBlockView.Key, event);
                break;
            case 'emit-event':
                this.pagesService.emitEvent(event);
                break;
        }
    }

    onBlockLoad(event: any) {
        this.pagesService.updateBlockLoaded(this.pageBlockView.Key);
    }
}
