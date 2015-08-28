function HistoryApiAdapter(mount){
  var adapter = {
    //renderData is a hash of data, params, and component
    // per resolved part of url
    renderer: function(renderData){
      var renderArr = Object.keys(renderData).map(function(mask){
        return {
          mask: mask,
          context: renderData[mask].context,
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
        partial.params.context = partial.context;

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

  var currentRenderData;

  adapter.handleTransition = function(data){

    var renderData = Object.keys(data.handler.resolvedModels).reduce(function(result, key){
      result[key] = data.renderData[key]?data.renderData[key]:currentRenderData[key];
      return result;
    }, {});
    currentRenderData = renderData;
    mount(adapter.renderer(renderData));
  }

  function handle(){
    var localUrl = document.location.pathname + document.location.search;
    adapter.handleURL(localUrl).then(function(data){
      return adapter.renderer(data.renderData);
    }).then(mount);
  }

  adapter.updateURL = function(url) {
    history.pushState(null, null, url);
  };


  window.onpopstate = handle;
  return adapter;
}

module.exports = HistoryApiAdapter;
