import React from "react"

class LoginComp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {login: '', pwd: '', err: ''};
    if(this.props.context.client){
      var client = this.props.context.client;
      client.on('login:fail', (err)=>{
        this.setState({err:err})
      })
    }
  }
  handleLogin (newValue) {
    this.setState({login: newValue});
  }
  handlePwd (newValue) {
    this.setState({pwd: newValue});
  }
  handleSubmit (e){
    e.preventDefault();
    this.setState({err:''})
    delete this.props.context._passChains
    this.props.context.login(this.state, this.props.context)
  }
  render() {
    var valueLinkLogin = {
      value: this.state.login,
      requestChange: this.handleLogin.bind(this)
    };
    var valueLinkPwd = {
      value: this.state.pwd,
      requestChange: this.handlePwd.bind(this)
    };
    var error;
    if(this.state.err){
      error = <p className="alert alert-danger">{this.state.err}</p>
    }
    return <div>
      <h2 className="text-center">Login</h2>
      <form onSubmit={this.handleSubmit.bind(this)} className="col-md-4 col-md-offset-4">
        {error}
        <div className="form-group">
          <label for="exampleInputEmail1">Email address</label>
          <input type="text" className="form-control"  placeholder="Login" valueLink={valueLinkLogin}/>
        </div>
        <div className="form-group">
          <label for="exampleInputPassword1">Password</label>
          <input type="password" className="form-control" placeholder="Password" valueLink={valueLinkPwd}/>
        </div>
        <button type="submit" className="btn btn-default">Login</button>
      </form>
    </div>
  }
}

export default LoginComp
