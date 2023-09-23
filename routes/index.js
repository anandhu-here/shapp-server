const routes = [
    require('./user')

];


module.exports = function router(app, db){
    return routes.forEach(route=>{
        route(app, db);
    })
}