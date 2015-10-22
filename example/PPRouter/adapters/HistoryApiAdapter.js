function HistoryApiAdapter(mount, rootElement, context){
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

  function handlePop(event){
    console.log("location: " + document.location + ", state: " + JSON.stringify(event.state))
    /*
    var localUrl = document.location.pathname + document.location.search;
    adapter.handleURL(localUrl, context).then(function(data){
      console.log(data.renderData, adapter.renderer(data.renderData));
      return adapter.renderer(data.renderData);
    }).then(mount);*/
  }

  adapter.updateURL = function(url) {
    history.pushState(null, null, url);
  };

  rootElement.onclick = function(e){
    var a = e.target.href?e.target:upTo(e.target, "a");
    if(a && a.nodeType == 1
        && a.href
        && a.href.indexOf(document.location.origin) == 0
        && !a.hasAttribute('data-native')) {//is a link
      e.preventDefault()
      e.stopPropagation();
      if(document.location.pathname !== a.pathname) {
        //Router.router.transitionTo(a.pathname, context)

        adapter.handleURL(a.pathname, context)
        .then(function(data){
          var stateObj = JSON.parse(JSON.stringify(data.renderData));
          console.log(stateObj)
          history.pushState(stateObj, "pageName", a.pathname)
          return data;
        }).then(function(data){
          return adapter.renderer(data.renderData);
        }).then(mount).catch(function(){
          console.log('ALL FAILED', arguments);
        });
      }
    }
  }
  // Find first ancestor of el with tagName
  // or undefined if not found
  function upTo(el, tagName) {
    tagName = tagName.toLowerCase();

    while (el && el.parentNode) {
      el = el.parentNode;
      if (el.tagName && el.tagName.toLowerCase() == tagName) {
        return el;
      }
    }
    // Many DOM methods return null if they don't
    // find the element they are searching for
    // It would be OK to omit the following and just
    // return undefined
    return null;
  }

  window.onpopstate = handlePop;
  return adapter;
}

module.exports = HistoryApiAdapter;
