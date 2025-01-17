import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';

import { NavigationService } from '../../services/navigation.service';
import { UtilitiesService } from '../../services/utilities.service';
// import { PagesService } from '../../services/pages.service';

import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings.routes';

import { config } from '../../common/addon.config';

@NgModule({
    declarations: [
        SettingsComponent
    ],
    imports: [
        CommonModule,
        PepNgxLibModule,
        SettingsRoutingModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
        NavigationService,
        UtilitiesService,
        // PagesService
    ]
})
export class SettingsModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService

    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
