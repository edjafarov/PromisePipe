import React from "react"

class ItemComp extends React.Component {
  constructor(props) {
    super(props);

    var nextBid = this.props.data[0].bids[0]?this.props.data[0].bids[0].bid:this.props.data[0].startBid;
    nextBid = nextBid || 0
    this.state = {
      me: {},
      bid: +nextBid+10,
      item: props.data && props.data[0]
    };

    if(this.props.context.client){
      var client = this.props.context.client;
      this.state.me = client.MeStore.get()
      client.MeStore.on('change', (user)=>{
        this.setState({me:user});
      })
      client.ItemStore.on('change', this.updateItem.bind(this ))
    }
  }
  componentWillUnmount (){
    if(this.props.context.client){
      var client = this.props.context.client;
      client.ItemStore.removeAllListeners('change')
    }
  }
  updateItem (item){
    this.setState({item:item, bid: +item.bids[0].bid+10});
  }
  makeABid(e){
    e.preventDefault();
    this.props.context.makeABid({
      bid: this.state.bid,
      id: this.state.item.id
    });
  }
  handleBid (newValue) {
    this.setState({bid: newValue});
  }
  render() {
    var valueLinkBid = {
      value: this.state.bid,
      requestChange: this.handleBid.bind(this)
    };
    var bids = this.state.item.bids || [];
    console.log(this.state)
    return <div className="row">
      <div className="col-md-4">
        <img src={"/images/" + this.state.item.img}/>
      </div>
      <div className="col-md-5">
        <h2>{this.state.item.name}<small>start bid: {this.state.item.startBid||0}</small></h2>
        <p>{this.state.item.description}</p>
      </div>
      <div className="col-md-3">
        <label className="currentBid">Bid: {this.state.item.bids[0]?this.state.item.bids[0].bid:this.state.item.startBid}&euro;</label>
        <form onSubmit={this.makeABid.bind(this)} className="form-inline">
          <div class="form-group"><input type="bid" valueLink={valueLinkBid} className="form-control"/></div><br/>
          <input type="submit" value="Make A Bid" className="btn btn-primary" disabled={!this.state.me.login || (this.state.item.bids[0] && this.state.me.id == +this.state.item.bids[0].uid)}/>
        </form>
        <div>Bidders:</div>
        <ul className="list-unstyled">
          {bids.map((bid)=><li><label><a href={"/users/" + bid.user.id}>{bid.user.name}</a></label>({bid.bid}&euro;)</li>)}
        </ul>
      </div>
    </div>
  }
}

export default ItemComp
