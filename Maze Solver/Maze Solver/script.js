document.addEventListener("DOMContentLoaded", () => {
    const maze = document.getElementById('maze');
    const solveButton = document.getElementById('solve');
    const restartButton = document.getElementById('restart');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const pathCountElement = document.getElementById('pathCount');
    const winMessage = document.getElementById('winMessage');
    const noPathMessage = document.getElementById('noPathMessage');

    const rows = 20;
    const cols = 20;
    const grid = [];
    let start = [0, 0];
    let end = [rows - 1, cols - 1];
    let pathCount = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const colors = {
        bfs: '#32CD32', // Green for BFS
        dfs: '#87CEEB', // Sky Blue for DFS
        astar: '#FF1493' // Dark Pink for A*
    };
    const animationDelay = 100; // Ensure this is set for visible animation

    // Load sounds
    const clickSound = new Audio('click.mp3');
    const superFastSound = new Audio('Super Fast Run after Star.mp3');
    const sadSound = new Audio('sad.mp3');
    const overSound = new Audio('over.mp3');

    function playSound(sound) {
        sound.play();
    }

    function stopSound(sound) {
        sound.pause();
        sound.currentTime = 0;
    }

    function createGrid() {
        maze.innerHTML = '';
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                if (i === 0 && j === 0) cell.classList.add('start');
                if (i === rows - 1 && j === cols - 1) cell.classList.add('end');
                maze.appendChild(cell);
                row.push(cell);
            }
            grid.push(row);
        }
    }

    function generateMaze() {
        const stack = [[0, 0]];
        const visited = new Set();
        visited.add([0, 0].toString());

        while (stack.length) {
            const [x, y] = stack[stack.length - 1];
            const neighbors = [];

            for (const [dx, dy] of directions) {
                const nx = x + dx * 2;
                const ny = y + dy * 2;
                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !visited.has([nx, ny].toString())) {
                    neighbors.push([dx, dy]);
                }
            }

            if (neighbors.length) {
                const [dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                const nx = x + dx * 2;
                const ny = y + dy * 2;

                grid[x + dx][y + dy].classList.remove('wall');
                grid[nx][ny].classList.remove('wall');

                stack.push([nx, ny]);
                visited.add([nx, ny].toString());
            } else {
                stack.pop();
            }
        }

        // Add walls randomly except start and end
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (Math.random() < 0.3 && !(i === 0 && j === 0) && !(i === rows - 1 && j === cols - 1)) {
                    grid[i][j].classList.add('wall');
                }
            }
        }
    }

    async function solveMaze(algorithm) {
        const queue = [];
        const visited = new Set();
        const prev = {};
        const allPaths = [];
        let pathFound = false;

        function stopAllSounds() {
            stopSound(superFastSound);
            stopSound(sadSound);
            stopSound(overSound);
        }

        async function bfs() {
            queue.push({ point: start, path: [start.toString()] });
            visited.add(start.toString());

            while (queue.length) {
                const { point: [x, y], path } = queue.shift();

                if (x === end[0] && y === end[1]) {
                    pathFound = true;
                    pathCount++;
                    pathCountElement.textContent = pathCount;
                    allPaths.push(path);

                    // Mark the path with color
                    for (let i = 0; i < path.length; i++) {
                        const [cx, cy] = path[i].split(',').map(Number);
                        grid[cx][cy].style.backgroundColor = colors.bfs;
                        await new Promise(resolve => setTimeout(resolve, animationDelay));
                    }
                    break;
                }

                for (const [dx, dy] of directions) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !visited.has([nx, ny].toString()) && !grid[nx][ny].classList.contains('wall')) {
                        queue.push({ point: [nx, ny], path: [...path, [nx, ny].toString()] });
                        visited.add([nx, ny].toString());
                        prev[[nx, ny].toString()] = [x, y];
                    }
                }
            }
        }

        async function dfs() {
            queue.push({ point: start, path: [start.toString()] });
            visited.add(start.toString());

            while (queue.length) {
                const { point: [x, y], path } = queue.pop();

                if (x === end[0] && y === end[1]) {
                    pathFound = true;
                    pathCount++;
                    pathCountElement.textContent = pathCount;
                    allPaths.push(path);

                    // Mark the path with color
                    for (let i = 0; i < path.length; i++) {
                        const [cx, cy] = path[i].split(',').map(Number);
                        grid[cx][cy].style.backgroundColor = colors.dfs;
                        await new Promise(resolve => setTimeout(resolve, animationDelay));
                    }
                    break;
                }

                for (const [dx, dy] of directions) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !visited.has([nx, ny].toString()) && !grid[nx][ny].classList.contains('wall')) {
                        queue.push({ point: [nx, ny], path: [...path, [nx, ny].toString()] });
                        visited.add([nx, ny].toString());
                        prev[[nx, ny].toString()] = [x, y];
                    }
                }
            }
        }

        async function astar() {
            const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
            const openSet = [{ point: start, path: [start.toString()], g: 0, h: heuristic(start, end) }];
            const cameFrom = new Map();

            while (openSet.length) {
                const current = openSet.shift();
                const { point: [x, y], path, g } = current;

                if (x === end[0] && y === end[1]) {
                    pathFound = true;
                    pathCount++;
                    pathCountElement.textContent = pathCount;
                    allPaths.push(path);

                    // Mark the path with color
                    for (let i = 0; i < path.length; i++) {
                        const [cx, cy] = path[i].split(',').map(Number);
                        grid[cx][cy].style.backgroundColor = colors.astar;
                        await new Promise(resolve => setTimeout(resolve, animationDelay));
                    }
                    break;
                }

                for (const [dx, dy] of directions) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const ng = g + 1;

                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !grid[nx][ny].classList.contains('wall')) {
                        const nh = heuristic([nx, ny], end);
                        const neighbor = [nx, ny].toString();

                        if (!openSet.find(item => item.point.toString() === neighbor) || ng < current.g) {
                            openSet.push({ point: [nx, ny], path: [...path, neighbor], g: ng, h: nh });
                            cameFrom.set(neighbor, [x, y]);
                        }
                    }
                }
            }
        }

        function getPath(prev, start, end) {
            const path = [];
            let current = end.toString();
            while (current !== start.toString()) {
                path.push(current);
                current = prev[current].toString();
            }
            path.push(start.toString());
            return path.reverse();
        }

        function drawPath(path, color) {
            for (const point of path) {
                const [x, y] = point.split(',').map(Number);
                grid[x][y].style.backgroundColor = color;
                setTimeout(() => {}, animationDelay);
            }
        }

        // Clear previous path highlights
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!grid[i][j].classList.contains('start') && !grid[i][j].classList.contains('end')) {
                    grid[i][j].style.backgroundColor = '';
                }
            }
        }

        // Start playing the traversal sound in loop
        superFastSound.loop = true;
        playSound(superFastSound);

        if (algorithm === 'bfs') {
            await bfs();
        } else if (algorithm === 'dfs') {
            await dfs();
        } else if (algorithm === 'astar') {
            await astar();
        }

        // Stop the traversal sound and handle win/loss messages
        stopSound(superFastSound);

        if (pathFound) {
            stopSound(sadSound);
            playSound(overSound);
            winMessage.style.display = 'block';
            noPathMessage.style.display = 'none';
        } else {
            playSound(sadSound);
            winMessage.style.display = 'none';
            noPathMessage.style.display = 'block';
        }
    }

    function resetMaze() {
        location.reload(); // Refresh the entire page
    }

    solveButton.addEventListener('click', () => {
        playSound(clickSound);
        solveMaze(algorithmSelect.value);
    });

    restartButton.addEventListener('click', () => {
        playSound(clickSound);
        resetMaze(); // Refresh the page
    });

    createGrid();
    generateMaze();
});
