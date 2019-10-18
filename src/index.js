import React from 'react';
import ReactDom from 'react-dom';
import './index.scss';
import openSocket from 'socket.io-client';

//Make connection
const socket = openSocket('http://192.168.1.200:4000');

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
      // alert("i receive players");
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
  render() {
    return (
      <button
      className={ this.props.isHovered ? "square hovered" : "square" }
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
        if (this.props.IamNext) {
          this.props.onClick(index);
        }
      }}
      isHovered={this.props.hovered[index]}
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
    const rows =    [0, 3, 6];
    const columns = [1, 2, 3];
    return (
      <div>
      {this.renderSquareWithNumber("R\\C", "horizontal vertical")}
      {columns.map((value, index) => {
          return this.renderSquareWithNumber(value, "horizontal", index);
      })}
      {rows.map((row_value) => {
        const items = [];
        items.push(
          columns.map((col_value) => {
            return this.renderSquare(row_value + col_value - 1, row_value + col_value - 1)
          })
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

class Move extends React.Component {
  constructor(props) {
    super(props);
    this.state = {rewind: false};
    socket.on("questionRewindMove", (data) => {
      this.setState({
        rewind: true,
        data: data
      });
    });
  }

  render() {
    let indexKey = this.props.indexKey;
    let step = this.props.step;
    return(
      <li key={indexKey}>
        <button
        onClick={() => {
          if (this.state.rewind) {
            socket.emit("answearRewindMove", this.state.data);
          } else {
            let data = {
              indexKey: this.props.indexKey,
              step: this.props.step
            };
            socket.emit("questionRewindMove", data)
          }
        }}
        onMouseOver={() => indexKey === 0 ? "" : this.props.highlightsSquare(step)}
        onMouseLeave={() => indexKey === 0 ? "" : this.props.unHighlightsSquare()}
        >
        {(this.state.rewind && this.state.data.indexKey === indexKey) ? "Player want to move to this step. Click if you are agree" : this.props.desc}
        </button>
      </li>
    );
  }

  // move(index, step = null, desc) {
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: null,
      room_id: null,
      isPlayerSelected: false,
      player: 'default',
      IamNext: false,
      won: false,
      history: [{squares: Array(9).fill(null),}],
      stepNumber: 0,
      hovered: Array(9).fill(false),
      order: true,
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
        player: 'default',
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
    socket.on("update_game_with_hovered", (data) => {
      this.setState({
        hovered: data.hovered
      });
    });
    socket.on("answearRewindMove", (data) => {
      this.jumpTo(data.indexKey, data.step);
    });

  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const winner = calculateWinner(squares);

    const squares_modified = squares.slice();
    squares_modified.splice(i, 1, this.state.player);
    let hovered = Array(9).fill(false);

    if (calculateWinner(squares_modified)) {
      let winner = calculateWinner(squares_modified);
      hovered.forEach((h_V, h_I) => {
          winner[1].forEach((l_V) => {
              if (h_I === l_V) {
                hovered.splice(h_I, 0, true);
              }
          });
      });
    }

    if (squares[i] || winner[0]) {
      this.setState({
        won: true
      });
      return;
    }

    let player = this.state.player;
    squares[i] = this.state.IamNext ? player : getOponentPlayer(player);
    let stepNumber = history.length;
    let data_to_modify = {
      history: history.concat([{
        squares: squares,
        grid: getColAndRow(i),
      }]),
      hovered: hovered,
      stepNumber: stepNumber,
      player: player,
      IamNext: !this.state.IamNext,
    };
    this.setState(data_to_modify);
    socket.emit("update_game", data_to_modify);
  }

  jumpTo(index, step) {
    console.log("index = " + index + "\n step = " + step.squares );
    let current_IamNext = this.state.IamNext;
    let current_stepNumber = this.state.stepNumber;
    let new_IamNext;
    if (index === 0) {
      new_IamNext = (current_stepNumber % 2) === 0 ? current_IamNext : !current_IamNext;
    } else {
      new_IamNext = ( (current_stepNumber - index) % 2) === 0 ? current_IamNext : !current_IamNext;
    }
    console.log("stepNumber " + index + " new IamNext: " + new_IamNext + " old IamNext " + current_IamNext);
    this.setState({
      stepNumber: index,
      IamNext: new_IamNext,
    });
  }

  highlightsSquare(step) {
    const history_squares = this.state.history[this.state.history.length - 1].squares.slice();
    const step_squares = step.squares;

    let hovered_result = [];
    history_squares.forEach(
      (h_s_V, h_s_I) => {
        hovered_result[h_s_I] =
        (step_squares[h_s_I] === h_s_V) ?
        !!h_s_V :
        false;
      });
      this.setState({
        hovered: hovered_result
      });
      socket.emit("hovered", {hovered: hovered_result});
    }

  unHighlightsSquare() {
    let hovered = Array(9).fill(false);
    this.setState({hovered: hovered});
    socket.emit("hovered", {hovered: hovered});
  }

  sort() {
    this.setState({
      order: !this.state.order
    });
  }

  makeSortButton() {
    return (
      <li key="sort">
        <button
        onClick={() => this.sort()}
        className="sort"
        title="sort moves"
        >
        Sort the moves <span className="order">{this.state.order ? "desc" : "asc"}</span>
        </button>
      </li>
    );
  }

  // move(index, step = null, desc) {
  //   return (
  //     <li key={index}>
  //       <button
  //       onClick={() => {
  //         socket.emit("questionRewindMove");
  //         let response = false;
  //         socket.on("responseRewindMove", (data) => {
  //           alert("In response");
  //           response = data.response
  //         });
  //         if (response) {
  //           this.jumpTo(index, step);
  //           if (index === 0) {
  //             this.setState({
  //               // clickMe: false,
  //               hovered: Array(9).fill(false),
  //               history: [{
  //                 squares: Array(9).fill(null),
  //               }],
  //             });
  //           }
  //
  //         }
  //       }}
  //       onMouseOver={() => index === 0 ? "" : this.highlightsSquare(step)}
  //       onMouseLeave={() => index === 0 ? "" : this.unHighlightsSquare()}
  //       >
  //       {desc}
  //       </button>
  //     </li>
  //   );
  // }


  createPlayer(player_sign) {
    return (
      <option value={player_sign}>Player {player_sign}</option>
    );
  }

  render() {
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
          value={this.state.player}
          onChange={(event) => {
            let player = event.target.value;
            this.setState({
              player: player,
            });
            socket.emit("selectedPlayer", {
              room_id: this.state.room_id,
              player: player
            })
          }}
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
                  hovered: this.state.hovered,
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

    const history = this.state.history;
    console.log(this.state.history);
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);
    const player =  this.state.player;

    const moves = history.map((step, index) => {
      let grid = step.grid;
      const desc = index ?
      'Go to move #' + index + " (Column: " + grid.col + ", Row: " + grid.row + ")" :
      'Go to game start';

      return (
        <Move
        key={index * index + 2}
        indexKey={index}
        desc={desc}
        step={step}
        highlightsSquare={this.highlightsSquare.bind(this)}
        unHighlightsSquare={this.unHighlightsSquare.bind(this)}
        />
      );
    });
    moves.splice(1, 0, this.makeSortButton());

    let status;
    if (winner[0]) {
      status = 'Winner: ' + winner[0];
    } else {

      status = 'Next player: ' + (this.state.IamNext ? player : getOponentPlayer(player));
    }

    let click_me = this.state.clickMe ? this.clickMeButton() : "";
    return (
      <div className="game">
        <h1 className="user-name">{player}</h1>
        <div className="game-board">
          <Board
          squares={current.squares}
          onClick={(i) => this.handleClick(i)}
          IamNext={this.state.IamNext}
          hovered={this.state.hovered}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <div>
          {click_me}
          {moves.slice(0,2)}
          </div>
          <div>{this.state.order ? moves.slice(2) : moves.slice(2).reverse()}</div>
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

function getColAndRow(i) {
  return {row : Math.floor(i / 3) + 1, col : i % 3 + 1};
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
