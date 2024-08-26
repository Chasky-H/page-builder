# Pages

## High Level

<!-- [Provide a high level overview of the addons. What features does it provides, how does it interact with other addons etc. ] -->
This addon allows creating pages with custom design settings, sections and columns can be added as needed.
You can drag & drop blocks from the available blocks to each column, the available blocks are the installed PageBlocks relations that the user has. 
Additionally, there is an option to pass various parameters between the page and the blocks as needed, for example, a store ID, order number, etc.

---

## Releases
| Version | Description | Migration |
|-------- |------------ |---------- |
<!-- | 0.1     | [The version description] | [specify any migrations introduced in this version] | -->
| 2.0     | Moving to Configurations | copy data from ADAL to Configurations |
| 3.0     | Moving to ngx-lib layout component | - |

---

## Deployment

<!-- [Specify any manual or non-manual deployment specific to this addon] -->
- After a Pull Request is merged into a release branch, a version will be published and pages tests will run. If the tests pass the version will be marked as available.

---

## Debugging

<!-- [Specify any debugging instructions specific to this addon] -->
- #### Client side: 
    To debug your addon with developer toolbar (chrome or any other browser dev tool).

    - Addon debugging (Edit & Create):
        - Open terminal --> change to client-side --> Start your addon with npm start.
        Run the webapp application go to Settings --> Pages --> Application Header.
        Add ?dev=true to the browser query (URL params). add debugger on your typescript code and reload the page. notice that dev=true will work only if your addon runs on port 4400.

    - Page Blocks debugging:
        - npm run start the page block addon.
        - for page blocks debugging: Add devBlocks=[["block-element-[PAGE_BLOCK_ADDON_UUID]","http://localhost:[PAGE_BLOCK_ADDON_PORT]/file_[PAGE_BLOCK_ADDON_UUID].js"]] to the url but replace the port instead [PAGE_BLOCK_ADDON_PORT] and the uuid of the page block addon instead [PAGE_BLOCK_ADDON_UUID].

- #### Server side: 
    - To debug your addon with `Visual Studio Code`, set the RUN mode to 'Launch API Server', press `F5` or `Run->Start Debugging`.
    You can then checkout your *API* at http://localhost:4500/api/foo. Be sure to supply a JWT for it to work.

- #### CPI side:
    - To debug the CPI side with `Visual Studio Code`, open the PEPPERI catalist application (simulator), login to the user that you want to debug, add 'debugger' at the cpi code,  set the RUN mode to 'Launch CPINode debugger Server', press `F5` or `Run->Start Debugging`. 

---

## Testing

<!-- [Specify any testing instructions specific to this addon] -->

---

## Dependencies

| Addon | Usage |
|-------- |------------ |
<!-- | [Add any dependecies on other addons]  | [Specify the reason for this dependency]  | -->
| [themes](https://github.com/Pepperi-Addons/themes) | clients should gets theme 
| [configurations](https://github.com/Pepperi-Addons/configurations) | pages data saved in configurations
| [pepperi_pack](https://github.com/Pepperi-Addons/pepperi-pack) | |
| translation | Allow user to translate configuration text if needed |

---

## APIs

<!-- [Provide links to API documentation] -->
The API is hosted on the [Pepperi API Design Center](https://apidesign.pepperi.com/pages/pages)

- [Page Block (relation)](https://apidesign.pepperi.com/addon-relations/addons-link-table/relation-names/page-block).
- [Pages events](https://apidesign.pepperi.com/headless-on-client/pages-events).
- [Page Load](https://apidesign.pepperi.com/headless-on-client/pages-events/page-load).
- [Page State Change](https://apidesign.pepperi.com/headless-on-client/pages-events/page-state-change).
- [Page Button Click](https://apidesign.pepperi.com/headless-on-client/pages-events/page-button-click).

[Postman Collection](./addon.postman_collection.json)

---

## Limitations

<!-- [Provide information regarding hard & soft limits] -->
Soft & Hard limit of pages - number of 100 pages.
Soft limits per page - number of block 15 and max page size 150KB.
Hard limits per page - number of block 30 and max page size 300KB.

---

## Architecture
see: [Architecture](./architecture.md)

---

## Known issues

<!-- - [provide any information regarding known issues (bugs, qwerks etc.) in the addon]  -->
- When dragging a block over a page with scroll, need also to scroll it manualy (it's a problem with the material drag & drop component). 

---

## Future Ideas & Plans

<!-- - [provide any knowledge regarding meaningful future plans for the addons (features, refactors etc.)] -->
