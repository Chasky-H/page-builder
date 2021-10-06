import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import {  map, tap } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { SlideshowService, PepperiTableComponent } from './index';
import { Observable } from 'rxjs';
import { PepMenuItem } from '@pepperi-addons/ngx-lib/menu';


@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss'],
  providers: [TranslatePipe]
})
export class SlideshowComponent implements OnInit {

    menuItems: Array<PepMenuItem> = [];
    showListActions = false;
    screenSize: PepScreenSizeType;
    options: {key:string, value:string}[] = [{key: "Option1", value: 'Option 1'},{key: "Option2", value: 'Option 2'}];
    dataSource$: Observable<any[]>
    displayedColumns = ['Name'];
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(PepperiTableComponent) table: PepperiTableComponent;


    constructor(
        public addonService: SlideshowService,
        public layoutService: PepLayoutService,
        public dialog: PepDialogService,
        public translate: TranslateService
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

    }

    ngOnInit() {
       this.dataSource$ = this.addonService.pepGet(`/items`);
       
       this.dataSource$.toPromise().then(res => this.hostEvents.emit({action: 'block-loaded'}));
    //    .pipe(
    //        map((addons: InstalledAddon[]) =>
    //          addons.filter(addon => addon?.Addon).map(addon => addon?.Addon))
    //     );
    }

    openDialog(){
        const content = this.translate.instant('Dialog_Body');
        const title = this.translate.instant('Dialog_Title');
        const dataMsg = new PepDialogData({title, actionsType: "close", content});
        this.dialog.openDefaultDialog(dataMsg);
    }

    ngAfterViewInit(): void {
        this.menuItems.push({key:'OpenDialog', text: 'Edit' });
    }

    onMenuItemClicked(e){

    }

    onActionsStateChanged(e){

    }




}
