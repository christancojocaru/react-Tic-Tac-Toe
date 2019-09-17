import React from 'react';
import ReactDom from 'react-dom';
import './index.scss';


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
            history: [{
                squares: Array(9).fill(null),
            }],
            stepNumber: 0,
            xIsNext: true,
            hovered: Array(9).fill(false),
            order: true
        };
    }

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
            console.log("winner");
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
        if (winner[0]) {
            alert("Player " + (this.state.xIsNext ? 'X' : 'O') + " won");
            return;
        } else if (squares[i]) {
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

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
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
    }

    unHighlightsSquare() {
        this.setState({
            hovered: Array(9).fill(false),
        });
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

    move(index, step, desc) {
        return (
            <li key={index}>
                <button
                    onClick={() => this.jumpTo(index)}
                    onMouseOver={() => this.highlightsSquare(step)}
                    onMouseLeave={() => this.unHighlightsSquare()}
                >
                    {desc}
                </button>
            </li>

        );
    }

    render() {
        const history = this.state.history;
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
                    <div>{moves.slice(0,2)}</div>
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