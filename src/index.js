import React from 'react';
import ReactDom from 'react-dom';
import './index.scss';
import openSocket from 'socket.io-client';

//Make connection
const socket = openSocket('http://localhost:4000');

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.other_player_name,
      want_you: false,
    };
    socket.on('send_connection', (data) => {
      // alert("I receive send_connection");
      //receive n times (n are number of server connections)
      //don't know why
      if (this.state.name === data.his_name) {
        this.setState({
          want_you: true,
        });
      }
    });
    socket.on("Not_Available", (message) => console.log(message));
  }

  makePlayer() {
    if (this.state.want_you) {
      return (
        <button
        className="player-button"
        onClick={() => {
          let data = {
            my_name: this.props.player_name,
            his_name: this.state.name,
            room_id: Math.floor(Math.random() * 1000)
          }
          socket.emit("create_connection", data);
        }}>
        Join
        </button>
      );
    } else {
      return (
        <button
        className="player-button"
        onClick={() => {
          let data = {
            my_name: this.props.player_name,
            his_name: this.state.name,
          }
          socket.emit("send_connection", data);
        }}>
        Select
        </button>
      );
    }
  }

  render() {
    return (
      <div className="player-data">
      <li>{this.state.name}</li>
      {this.makePlayer()}
      </div>
    );
  }
}

class Connection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      players: null
    };

    socket.on('receive_players', (players) => {
      let other_players = players.filter((player) => {
        return player.socket_id !== socket.id;
      });
      this.setState({players: other_players});
    });
    socket.on("join_connection", (data) => {
      // alert("I receive join_connection");
      socket.emit("join_connection", data);
    });
  }

  render() {
    let players = this.state.players;
    console.log(players);
    if (players === null || players.length === 0) {
      return (<p><strong>{this.state.name}</strong>. Please wait for oponents</p>);
    }
    let data = players.map((player, id) => {
      return (<Player
        key={id}
        player_name={this.state.name}
        other_player_name={player.name}
        />);
    });
    return (
      <div>
      <p>Hello <b>{this.state.name}</b>. Please select a player</p>
      <ol>
      {data}
      </ol>
      </div>
    );
  }
}

class Square extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <button
      // className={ this.state.isHovered ? "square hovered" : "square" }
      className="square"
      onClick={this.props.onClick}
      >
      {this.props.value}
      </button>
    );
  }
}

class Board extends React.Component {
  renderSquare(index, key) {
    return (
      <Square
      key={key}
      value={this.props.squares[index]}
      onClick={() => {
        this.props.onClick(index);
        if (!this.props.IamNext) {
          alert("Not your turn!");
        }
      }}
      // isHovered={this.props.hovered[index]}
      />
    );
  }

  renderSquareWithNumber(number, scaling, key) {
    let classNames = ["square", "info", scaling];
    return (
      <span
      key={key}
      className={classNames.join(" ")}
      >
      {number}
      </span>
    );
  }

  render() {
    const rows = [0, 3, 6];
    const columns = [1, 2, 3];
    return (
      <div>
      {this.renderSquareWithNumber("R\\C", "horizontal vertical")}
      {columns.map(
        (value, index) => {
          return this.renderSquareWithNumber(value, "horizontal", index);
      })}
      {rows.map(
        (row_value) => {
          const items = [];
          items.push(
            columns.map(
              (col_value) => {
                return this.renderSquare(row_value + col_value - 1, row_value + col_value - 1)
              }
            )
          );
          return (
            <div key={row_value} className="board-row">
            {this.renderSquareWithNumber(row_value / 3 + 1, "vertical")}
            {items}
            </div>
          );
      })}
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
  super(props);
  this.state = {
    name: null,
    room_id: null,
    isPlayerSelected: false,
    player: null,
    IamNext: null,
    won: false,
    history: [{squares: Array(9).fill(null),}],
    stepNumber: 0,
    // hovered: Array(9).fill(false),
    // order: true,
    // clickMe: false,
  };
  socket.on("init_game", (data) => {
    this.setState({
      room_id: data.room_id
    });
  });
  socket.on("selectedPlayer", (data) => {
      this.setState({
          player: data.player === "X" ? "O" : "X",
      });
  });
  socket.on("disconnect", () => {
    // alert("i receive disconnect")
    this.setState({
      room_id: null,
      isPlayerSelected: false,
      player: null,
      IamNext: null,
      won: false,
      history: [{squares: Array(9).fill(null),}],
      stepNumber: 0,
    });
  });
  socket.on("update_game", (big_data) => {
    let data = big_data[socket.id];
    if (data.player === this.state.player) {
      this.setState({
        player:data.player,
        IamNext: data.IamNext,
        history: data.history,
        stepNumber: data.stepNumber,
        isPlayerSelected: true,
      });
    }
  });
  }

  handleClick(i) {
    // const Next = this.state.IamNext ? 'X' : 'O';
    // const history = this.state.history.slice(0, this.state.stepNumber + 1);
    // const current = history[history.length - 1];
    // const squares = current.squares.slice();
    // const winner = calculateWinner(squares);
    // const squares_modified = squares.slice();
    // squares_modified.splice(i, 1, Next);
    // console.log(calculateWinner(squares_modified));

    // if (calculateWinner(squares_modified)) {
      // let winner = calculateWinner(squares_modified);
    //   let hovered = Array(9).fill(false);
    //   hovered.forEach(
    //     (h_V, h_I) => {
    //       winner[1].forEach(
    //         (l_V) => {
    //           if (h_I === l_V) {
    //             hovered.splice(h_I, 0, true);
    //           }
    //         });
    //       });
    //       this.setState({
    //         hovered: hovered,
    //       });
        // }
    // if (squares[i] || winner[0]) {
    //   this.setState({
    //     won: true
    //   });
    //   return;
    // }
    // squares[i] = this.state.xIsNext ? 'X' : 'O';
    // this.setState({
    //   history: history.concat([{
    //     squares: squares,
    // //     grid: getColAndRow(i),
    //   }]),
    //   stepNumber: history.length,
    //   IamNext: !this.state.IamNext
    // });
  }

  createPlayer(player_sign) {
    return (
      <option
      selected={this.state.player === player_sign}
      onClick={() => {
        this.setState({
          player: player_sign,
        });
        socket.emit("selectedPlayer", {
          room_id: this.state.room_id,
          player: player_sign
        })
      }}
      >
      Player {player_sign}</option>
    );
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    let status;
    if (winner[0]) {
      status = 'Winner: ' + winner[0];
    } else {
      let player =  this.state.player;
      status = 'Next player: ' + (this.state.IamNext ? player : getOponentPlayer(player));
    }

    if (this.state.name === null) {
      return (
        <div>
        <input id="name" type="text" placeholder="Please insert a name" />
        <button
        id={"send_name"}
        onClick={() => {
          let inserted_name = document.getElementById("name").value;
          let data = {
            socket_id: socket.id,
            name: inserted_name
          };
          socket.emit("add_player", data);
          this.setState({
            name: data.name
          });
        }}
        >Select</button>
        </div>
      );
    }
    if (this.state.room_id === null) {
      return (
        <Connection name={this.state.name} />
      );
    }
    if (!this.state.isPlayerSelected) {
      return (
        <div className="select-player">
        <h3>Please Select a player Mr. {this.state.name} .</h3>
        <select
        className="start-input"
        defaultValue={'default'}
        >
        <option value={'default'} disabled>Select player</option>
        {this.createPlayer("X")}
        {this.createPlayer("O")}
        </select>
        <div className="start-button">
        <button
        className="start-input"
        onClick={() => {
          let select = document.querySelector("select.start-input");
          let isSelect = select.value !== "default";
          if (isSelect) {
            this.setState({isPlayerSelected: true})
            socket.emit("start_game", {
              player: this.state.player,
              history: this.state.history,
              stepNumber: this.state.stepNumber
            });
          } else {
            alert("Please select a player!");
            select.click();
          }
        }}>
        Start Game
        </button>
        <button
        className="close-input"
        onClick={() => {
          socket.emit("select_another_player", {room_id: this.state.room_id});
        }}>
        Select another player
        </button>
        </div>
        </div>
      );
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
          squares={current.squares}
          onClick={(i) => this.handleClick(i)}
          IamNext={this.state.IamNext}
          // hovered={this.state.hovered}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
        </div>
      </div>
    );
  }
}

ReactDom.render(
  <Game />,
  document.getElementById("root")
);

function getOponentPlayer(player) {
  return player === "X" ? "O" : "X";
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c] ) {
            return [squares[a], lines[i]];
        }
    }
    return false;
}
