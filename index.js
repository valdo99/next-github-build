const crypto = require('crypto');
const github = require('simple-git')();
const {exec} = require('child_process');

const tagLabel = "github webhook"

const restartApplication = require("./lib/restart-application")
// remember that req and res are NEXTJS req, res types



async function index({req,res,githubSecret}){
    


    if(!githubSecret){
        return res.send("missing githubSecret")
    }

    if(!req || !res){
        return res.send("missing req res")
    }


    const sign = req.headers["x-hub-signature"];
    const hash = "sha1=" + crypto.createHmac('sha1', githubSecret).update(JSON.stringify(req.body)).digest('hex');

    if(hash !== sign) {
        return res.send("hash !== sign");
    }

    const localBranch = (await github.branch()).current
    const pushBranch = req.body.ref.split("/")[2]

    if( localBranch !== pushBranch ){
        console.log("Branch is not the same as indicated");
        return res.send("KO")
    }

    res.send("OK")

    try {


        console.log('Fetching repo', {tagLabel});
        await github.fetch(['--all']);

        console.log('Hard reset', {tagLabel});
        await github.reset('hard',);

        console.log('Pulling repo', {tagLabel});
        const response = await github.pull();
        console.log("", {response});
        console.log("Pull completed", {summary: response.summary, files: response.files, tagLabel});

        if (response.files.length && response.files.indexOf('package.json') >= 0) {

            console.log('Running YARN install', {tagLabel});

            exec('yarn install', (err, stdout, stderr) => {

                if (err) {
                    console.error("Can't update with YARN", err);
                }

                console.log("NPM packages updated");

                restartApplication();

            });
        } else
            restartApplication();
    }
    catch (error) {
        console.error('Error during execution', { tagLabel, error } );
    }
}


module.exports = index