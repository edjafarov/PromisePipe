function ExpressAppAdapter(app){
  var adapter = {
    //renderData is a hash of data, params, and component
    // per resolved part of url
    renderer: function(renderData){
      var renderArr = Object.keys(renderData).map(function(mask){
        return {
          mask: mask,
          component: renderData[mask].component,
          params: renderData[mask].params,
          data: renderData[mask].data
        }
      })
      function renderComp(renderArr){
        var partial = renderArr.shift();

        if(renderArr.length > 0) partial.params.children = [renderComp(renderArr)];
        partial.params.mask = partial.mask;
        partial.params.data = partial.data;

        if(!partial.component) {
          var result = partial.data || '';
          if(partial.params.children && partial.params.children[0]) result +=partial.params.children[0];
          return result;
        }

        return partial.component(partial.params)

      }
      return renderComp(renderArr);
    }
  };

  app.use(function(req, res, next){
    if(req.method == 'GET'){
      adapter.handleURL(req.originalUrl).then(function(data){
        res.send(adapter.renderer(data.renderData) || "");
        res.end();
      });
      return;
    }
    next();
  })

  return adapter;
}

module.exports = ExpressAppAdapter;
