import React from 'react';
import ReactDom from 'react-dom';
import './index.scss';
import openSocket from 'socket.io-client';

//Make connection
const socket = openSocket('http://localhost:4000');

class Square extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isHovered: props.isHovered,
            timerIDs: props.timerIDs,
        };
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.isHovered !== props.isHovered) {
            return {
                isHovered: props.isHovered
            }
        } else {
            return null;
        }
    }

    render() {
        return (
            <button
                className={ this.state.isHovered ? "square hovered" : "square" }
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
                onClick={() => this.props.onClick(index)}
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
            name: this.props.name,
            room_id: this.props.room_id,
            IamNext: true,
            won: false,
            isPlayerSelected: false,
            player: null,
            // history: [{
                // squares: Array(9).fill(null),
            // }],
            // stepNumber: 0,
            // hovered: Array(9).fill(false),
            // order: true,
            // clickMe: false,
        };
    }

    componentDidMount() {
        socket.on("selectedPlayer", (data) => {
            this.setState({
                player: data.player === "X" ? "O" : "X",
            });
        });

        socket.on("friend_disconnected", () => {
            changeConnectionToGame(this.state.name);
        });
    }
    //
    handleClick(i) {
        const xIsNext = this.state.xIsNext ? 'X' : 'O';
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const winner = calculateWinner(squares);
        const squares_modified = squares.slice();
        squares_modified.splice(i, 1, xIsNext);
        console.log(calculateWinner(squares_modified));

        if (calculateWinner(squares_modified)) {
            let winner = calculateWinner(squares_modified);
            let hovered = Array(9).fill(false);
            hovered.forEach(
                (h_V, h_I) => {
                    winner[1].forEach(
                        (l_V) => {
                            if (h_I === l_V) {
                                hovered.splice(h_I, 0, true);
                            }
                        });
                });
            this.setState({
                hovered: hovered,
            });
        }
        if (squares[i] || winner[0]) {
            this.setState({
                won: true
            });
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares: squares,
                grid: getColAndRow(i),
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext
        });
    }
    //
    // jumpTo(index, step) {
    //     console.log("index = " + index + "\n step = " + step.squares );
    //     let current_xIxNext = this.state.xIsNext;
    //     let current_stepNumber = this.state.stepNumber;
    //     let new_xIsNext;
    //     if (index === 0) {
    //         new_xIsNext = (current_stepNumber % 2) === 0 ? current_xIxNext : !current_xIxNext;
    //     } else {
    //         new_xIsNext = ( (current_stepNumber - index) % 2) === 0 ? current_xIxNext : !current_xIxNext;
    //     }
    //     this.setState({
    //         stepNumber: index,
    //         xIsNext: new_xIsNext,
    //     });
    // }
    //
    // highlightsSquare(step) {
    //     const history_squares = this.state.history[this.state.history.length - 1].squares.slice();
    //     const step_squares = step.squares;
    //
    //     let hovered_result = [];
    //     history_squares.forEach(
    //         (h_s_V, h_s_I) => {
    //             hovered_result[h_s_I] =
    //                 (step_squares[h_s_I] === h_s_V) ?
    //                     !!h_s_V :
    //                     false;
    //         });
    //     this.setState({
    //         hovered: hovered_result
    //     });
    // }
    //
    // unHighlightsSquare() {
    //     this.setState({
    //         hovered: Array(9).fill(false),
    //     });
    // }
    //
    // sort() {
    //     this.setState({
    //         order: !this.state.order
    //     });
    // }
    //
    // makeSortButton() {
    //     return (
    //         <li key="sort">
    //             <button
    //                 onClick={() => this.sort()}
    //                 className="sort"
    //                 title="sort moves"
    //             >
    //                 Sort the moves <span className="order">{this.state.order ? "desc" : "asc"}</span>
    //             </button>
    //         </li>
    //     );
    // }
    //
    // move(index, step = null, desc) {
    //     return (
    //         <li key={index}>
    //             <button
    //                 onClick={() => {
    //                     this.jumpTo(index, step);
    //                     if (index === 0) {
    //                         this.setState({
    //                             clickMe: false,
    //                             hovered: Array(9).fill(false),
    //                             history: [{
    //                                 squares: Array(9).fill(null),
    //                             }],
    //                         });
    //                     }
    //                 }}
    //                 onMouseOver={() => index === 0 ? "" : this.highlightsSquare(step)}
    //                 onMouseLeave={() => index === 0 ? "" : this.unHighlightsSquare()}
    //             >
    //                 {desc}
    //             </button>
    //         </li>
    //
    //     );
    // }
    //
    // clickMeButton() {
    //     return (
    //         <div className="click-me">
    //             &#8601; Click me!
    //         </div>
    //     );
    // }
    //
    createPlayer(player_name) {
        return (
            <option
                selected={this.state.player === player_name}
                onClick={() => {
                  this.setState({
                    player: player_name,
                  });
                  socket.emit("selectedPlayer", {
                      room_id: this.state.room_id,
                      player: player_name
                  })
                }}
            >
                Player {player_name}</option>
        );
    }

    render() {
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
                                let select = document.querySelector("select");
                                let isSelect = select.value !== "default";
                                if (isSelect) {
                                    this.setState({playerSelected: true})
                                } else {
                                    select.click();
                                }
                            }}>
                            Start Game
                        </button>
                        <button
                            className="close-input"
                            onClick={() => {
                              changeConnectionToGame({
                                game: false,
                                room_id: this.state.room_id,
                                name: this.state.name
                              });
                            }}>
                            Select another player
                        </button>
                    </div>
                </div>
            );
        }

        const history = this.state.history;
        console.log(history, this.state.stepNumber);
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        const moves = history.map((step, index ) => {
            let grid = step.grid;
            const desc = index ?
                'Go to move #' + index + " (Column: " + grid.col + ", Row: " + grid.row + ")" :
                'Go to game start';

            return (this.move(index, step, desc));
        });
        moves.splice(1, 0, this.makeSortButton());

        let status;
        if (winner[0]) {
            status = 'Winner: ' + winner[0];
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }

        if (winner[0] && this.state.won) {
            setTimeout(() => {
                this.setState({
                    won: false,
                    clickMe: true
                });
                let int = setInterval(() => {
                    document.querySelectorAll(".game-info div")[1]
                        .querySelector("div li").classList.toggle("red");
                }, 200);
                setTimeout(() => clearInterval(int), 1400)
            }, 2000);
            setTimeout(() => {
                document.querySelector(".alert").style.animation = "fadeOut 500ms linear";
            }, 1500);//2000 - 500ms )
            return (
                <div className="alert" >
                    <h1>
                        {"Player \"" + (this.state.xIsNext ? 'O' : 'X') + "\" won"}{/*true*false are changed because state change */}
                    </h1>
                    <h3>
                        Please select "Go to game start" button
                    </h3>
                </div>
            );
        }

        let click_me = this.state.clickMe ? this.clickMeButton() : "";

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                    squares={current.squares}
                    onClick={(i) => this.handleClick(i)}
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

class Connection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          name: this.props.name,
          players: null,
          room: null,
          player_want_you: null,
        };

    socket.on('receive_players', (players) => {
        console.log("receive_players");
        this.setState({players: players});
    });
    socket.on('connect_player', (data) => {
        console.log("connect_player");
        this.setState({player_want_you: data.name});
    });
  }

  render() {
    if (this.state.name === null) {
      return (
        <div>
          <input id="name" type="text" placeholder="Please insert a name" />
          <button
            id="send_name"
            onClick={() => {
              let inserted_name = document.getElementById("name").value;
              let data = {
                socket_id: socket.id,
                name: inserted_name
              }
              socket.emit("add_player", data);
              this.setState({
                name: data.name
              });
            }}
          >Select</button>
        </div>
      );
    }

    let player_want_you = this.state.player_want_you

    let players = this.state.players;
    if (players === null || players.length === 1) {
      return (<p>Please wait for oponents</p>);
    }
    players = players.filter((player) => {
      return player.socket_id !== socket.id;
    });
    let data = players.map((player, id) => {
      return (<Player
          key={id}
          name={this.state.name}
          player_want_you={this.state.player_want_you}
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

class Player extends React.Component {
  constructor(props) {
    super(props);
    socket.on("join_room", (data) => {
      changeConnectionToGame({game: true, room_id: data.room_id, name: this.props.name});
      socket.emit("join_room", {
        room_id: data.room_id,
        socket_id: data.socket_id,
      });
    });
  }

  makePlayer() {
    let his_name = this.props.player_want_you;
    let my_name = this.props.name;


    if (his_name !== null) {
      return (
        <button
          className="player-button"
          onClick={() => {
            let data = {
              player_name: my_name,
              other_player_name: his_name,
              room_id: Math.floor(Math.random() * 1000)
            }
            socket.emit("create_room", data);
            setTimeout(changeConnectionToGame, 500, {game: true, room_id: data.room_id, name: this.props.name});
          }}>
        Join
        </button>
      );
    } else {
      return (
        <button
          className="player-button"
          onClick={() => {
            socket.emit("connect_player", my_name);
          }}>
        Select
        </button>
      );
    }
  }

  render() {
    return (
      <div className="player-data">
        <li>{this.props.name}</li>
        {this.makePlayer()}
      </div>
    );
  }
}

ReactDom.render(
  <Connection name={null} />,
  document.getElementById("user")
);

 socket.on("hello", () => {
   alert("hello");
 });

function changeConnectionToGame(data) {
  if (data.game) {
    ReactDom.unmountComponentAtNode(
      document.getElementById("user")
    );
    ReactDom.render(
        <Game room_id={data.room_id} name={data.name} />,
        document.getElementById("root")
    );
    socket.emit('test', data.room_id);
  } else {
    ReactDom.unmountComponentAtNode(
      document.getElementById("root")
    );
    ReactDom.render(
      <Connection name={data.name} />,
      document.getElementById("user")
    );
  }
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
