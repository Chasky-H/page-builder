import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: ``,
        children: [
            {
                path: 'pages',
                loadChildren: () => import('./components/pages-manager/pages-manager.module').then(m => m.PagesManagerModule)
            },
            {
                path: 'page_builder/:page_id',
                // component: PageBuilderComponent
                // TODO: solve routing
                loadChildren: () => import('./components/page-manager/page-manager.module').then(m => m.PageManagerModule)
            }
        ]
    },
    {
        path: '**',
        component: EmptyRouteComponent
    }
];

@NgModule({
    imports: [
        // RouterModule.forChild(routes),
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }



