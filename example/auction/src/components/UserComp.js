import React from "react"

class UserComp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.data && props.data[0]
    };
  }
  render() {
    return <div>
      <h2>{this.state.user.id}: {this.state.user.name}</h2>
      <p>login: {this.state.user.login}</p>
    </div>
  }
}

export default UserComp
