import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { IParamemeter } from '@pepperi-addons/ngx-composite-lib/manage-parameters';
import { BaseDestroyerDirective } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { Page } from '@pepperi-addons/papi-sdk';
import { SYSTEM_PARAMETERS } from 'shared';
import { PagesService, IPageEditor } from '../../services/pages.service';

@Component({
    selector: 'page-builder-editor',
    templateUrl: './page-builder-editor.component.html',
    styleUrls: ['./page-builder-editor.component.scss']
})
export class PageBuilderEditorComponent extends BaseDestroyerDirective implements OnInit {
    @ViewChild('parametersDialogTemplate', { static: true, read: TemplateRef }) parametersDialogTemplate!: TemplateRef<any>;
        
    @Output() pageNameChange: EventEmitter<string> = new EventEmitter<string>();

    pageName: string = '';
    pageDescription: string = '';
    
    private _parameters: IParamemeter[] = [];
    set parameters(value: IParamemeter[]) {
        this._parameters = value || [];
    }
    get parameters(): IParamemeter[] {
        return this._parameters;
    }
    
    private _onLoadFlow: any = {};
    set onLoadFlow(value: any) {
        this._onLoadFlow = value;
    }
    get onLoadFlow(): any {
        return this._onLoadFlow;
    }
    
    private _onParameterChangeFlow: any = {};
    set onParameterChangeFlow(value: any) {
        this._onParameterChangeFlow = value;
    }
    get onParameterChangeFlow(): any {
        return this._onParameterChangeFlow;
    }

    private _onChangeFlow: any = {};
    set onChangeFlow(value: any) {
        this._onChangeFlow = value;
    }
    get onChangeFlow(): any {
        return this._onChangeFlow;
    }

    onLoadFlowHostObject;
    onParameterChangeFlowHostObject;
    onChangeFlowHostObject;
    parametersDialogRef: MatDialogRef<any> = null;

    constructor(
        private dialogService: PepDialogService,
        private pagesService: PagesService
    ) { 
        super();
    }

    private prepareFlowHostObject(flowHostObjectName:any, flowObject: any) {
        const fields = {};
        
        for (let index = 0; index < this.parameters.length; index++) {
            const param = this.parameters[index];
            fields[param.Key] = {
                Type: param.Type
            }
        }

        for (let index = 0; index < SYSTEM_PARAMETERS.length; index++) {
            const sp = SYSTEM_PARAMETERS[index];
            fields[sp.Key] = {
                Type: sp.Type
            }
        }
        
        this[flowHostObjectName] = {};
        this[flowHostObjectName]['runFlowData'] = flowObject;
        this[flowHostObjectName]['fields'] = fields;
    }

    private prepareFlowHostObjects() {
        this.prepareFlowHostObject('onLoadFlowHostObject', this.onLoadFlow);
        this.prepareFlowHostObject('onParameterChangeFlowHostObject', this.onParameterChangeFlow);
        this.prepareFlowHostObject('onChangeFlowHostObject', this.onChangeFlow);
    }

    private updateHostObject() {
        const pageEditor: IPageEditor = {
            pageName: this.pageName,
            pageDescription: this.pageDescription,
            parameters: this.parameters,
            onLoadFlow: this.onLoadFlow,
            onParameterChangeFlow: this.onParameterChangeFlow,
            onChangeFlow: this.onChangeFlow
        };
        
        this.prepareFlowHostObjects();
        
        this.pagesService.updatePageFromEditor(pageEditor);
    }

    private setEditorData(pageData: Page) {
        if (pageData) {
            this.pageName = pageData.Name;
            this.pageDescription = pageData.Description;
            this.parameters = pageData.Parameters || [];
            this.onLoadFlow = pageData.OnLoadFlow;
            this.onParameterChangeFlow = pageData.OnParameterChangeFlow;
            this.onChangeFlow = pageData.OnChangeFlow;

            this.prepareFlowHostObjects();
        }
    }

    ngOnInit(): void {
        this.setEditorData(this.pagesService.pageDataForEditor);
        
        // Update the editor with the page data
        this.pagesService.pageDataForEditorChange$.pipe(this.getDestroyer()).subscribe((pageData: Page) => {
            this.setEditorData(pageData);
        });
    }

    onPageNameChange(value: string) {
        this.pageName = value;
        this.updateHostObject();

        this.pageNameChange.emit(this.pageName);
    }

    onPageDescriptionChange(value: string) {
        this.pageDescription = value;
        this.updateHostObject();
    }

    onLoadFlowChange(flowData: any) {
        this.onLoadFlow = flowData;
        this.updateHostObject();
    }

    onParameterChangeFlowChange(flowData: any) {
        this.onParameterChangeFlow = flowData;
        this.updateHostObject();
    }

    onChangeFlowChange(flowData: any) {
        this.onChangeFlow = flowData;
        this.updateHostObject();
    }
    
    openParametersPickerDialog() {
        const config = this.dialogService.getDialogConfig({ disableClose: false }, 'large');
        const data = {
            parameters: this.parameters || []
        };

        this.parametersDialogRef = this.dialogService.openDialog(this.parametersDialogTemplate, data, config);
    }

    onParametersChange(parameters: IParamemeter[]): void {
        this.parameters = parameters;
        this.updateHostObject();
    }

    closeParametersDialog(event) {
        this.parametersDialogRef?.close(event);
    }
}
