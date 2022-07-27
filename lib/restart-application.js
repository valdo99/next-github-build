module.exports = restartApplication = function () {
    exec('yarn build', (err, stdout, stderr) => {

        if (err) {
            console.error("Can't build next repo", err);
        }

        console.log("build successful");

        exec('yarn build', (err, stdout, stderr) => {

            if (err) {
                console.error("Can't start next repo", err);
            }
    
            console.log("repo restarted");
    
        });
        

    });
}