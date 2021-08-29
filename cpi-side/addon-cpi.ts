import '@pepperi-addons/cpi-node'

export async function load(configuration: any) {
    console.log('cpi side works!');
    // Put your cpi side code here
}

export const router = Router();

// Get the page by Key
router.get("/pages/:key", async (req, res) => {
    let page = {};
    
    try {
        console.log("CPISide - GET page with query params (page key)");
        // pages = await pepperi.api.adal.getList({ 
        //     addon: '50062e0c-9967-4ed4-9102-f2bc50602d41',
        //     table: 'Pages'
        // }).then(obj => obj.objects);
        
        page = await pepperi.api.adal.get({ 
            addon: '50062e0c-9967-4ed4-9102-f2bc50602d41',
            table: 'Pages',
            key: req.params.key
        }).then(obj => obj.object);

    } catch(exception) {
        // Handle exception.
    }

    res.json({ result: page });
});

// Example get function from Dor
// //setup routers for router automation tests
// router.get("/addon-api/get", (req, res) => {
//     console.log("AddonAPI test currently on CPISide - GET with query params");
//     const queryString = req.query.q;
//     if (
//       queryString === "queryParam" &&
//       queryString !== null &&
//       queryString !== undefined
//     ) {
//       res.json({
//         result: "success",
//         params: queryString,
//       });
//     }
//     res.json({ result: "failure" });
// });
// router.post("/pages")