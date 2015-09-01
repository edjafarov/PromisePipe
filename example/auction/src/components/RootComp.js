import React from "react"

class RootComp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      me: {},
      items: props.data || []
    }
    if(this.props.context.client){
      var client = this.props.context.client;
      this.state.me = client.MeStore.get()
      client.MeStore.on('change', (user)=>{
        this.setState({me:user});
      })
      client.ItemsStore.fill(props.data);
      client.ItemsStore.on('change', (items)=>{
        this.setState({items:items});
      })
    }
  }
  componentWillUnmount (){
    if(this.props.context.client){
      var client = this.props.context.client;
      client.ItemsStore.removeAllListeners('change')
      client.MeStore.removeAllListeners('change')
    }
  }
  logout(e){
    e.preventDefault();
    this.props.context.logout(null, this.props.context);
  }
  render() {
    var data = this.state.items;
    var content;
    if(this.props.children && this.props.children[0]) {
      content = this.props.children;
    } else {

      content = <ul className="list-unstyled auction-list">
      {data.map((item)=>{
        return <li className="row">
          <div className="col-md-2"><img src={'/images/' + item.img}/></div>
          <div className="col-md-8">
          <h3><a href={'/item/' + item.id}>name: {item.name}</a></h3>
          <p>
            {item.description}
          </p>
          </div>
          <div className="col-md-2 text-right">
            <label className="bid">bid: {item.bids && item.bids[0]?item.bids[0].bid:item.startBid}&euro;</label>
            <div className="by">{item.bids && item.bids[0]?(' by ' + item.bids[0].user.name):''}</div>
          </div>
        </li>
      })}
      </ul>;
    }
    var loggedInUser;

    if(this.state.me.name){
      loggedInUser = [<li>
          <a href={"/users/" + this.state.me.id}>{this.state.me.name}</a>
          </li>,
          <li>
          <a className="btn btn-default" onClick={this.logout.bind(this)}>Logout</a>
        </li>];

    } else {
      loggedInUser = <li><a href="/login">Login</a></li>;
    }
    return <div>
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="navbar-brand" href="/">Open Auction</a>
          </div>
          <ul className="nav navbar-nav navbar-right">
            {loggedInUser}

          </ul>
        </div>
      </nav>
      {content}
    </div>
  }
}

export default RootComp
