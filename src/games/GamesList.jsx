// src/games/gamesList.js

import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExtensionIcon from "@mui/icons-material/Extension";
import CasinoIcon from "@mui/icons-material/Casino";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import GridOnIcon from "@mui/icons-material/GridOn";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AlbumIcon from "@mui/icons-material/Album";
import Looks3Icon from "@mui/icons-material/Looks3";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import CasinoOutlinedIcon from "@mui/icons-material/CasinoOutlined";
import AppsIcon from "@mui/icons-material/Apps";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import MemoryIcon from "@mui/icons-material/Memory";
import FlipIcon from "@mui/icons-material/Flip";
import BlurCircularIcon from "@mui/icons-material/BlurCircular";
import GradientIcon from "@mui/icons-material/Gradient";
import FilterNoneIcon from "@mui/icons-material/FilterNone";
import CategoryIcon from "@mui/icons-material/Category";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import HighlightIcon from "@mui/icons-material/Highlight";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CalculateIcon from "@mui/icons-material/Calculate";
import NotesIcon from "@mui/icons-material/Notes";
import WbIncandescentIcon from "@mui/icons-material/WbIncandescent";
import Grid4x4Icon from "@mui/icons-material/Grid4x4";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ContrastIcon from "@mui/icons-material/Contrast";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import CasinoTwoToneIcon from "@mui/icons-material/CasinoTwoTone";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TimelineIcon from "@mui/icons-material/Timeline";
import PanoramaVerticalIcon from "@mui/icons-material/PanoramaVertical";
import LinkedCameraIcon from "@mui/icons-material/LinkedCamera";
import Grid3x3Icon from "@mui/icons-material/Grid3x3";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LineStyleIcon from "@mui/icons-material/LineStyle";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import DashIcon from "@mui/icons-material/HorizontalRule";
import BallotIcon from "@mui/icons-material/Ballot";
import NumbersIcon from "@mui/icons-material/Numbers";
import FilterVintageIcon from "@mui/icons-material/FilterVintage";

// THE MASTER GAMES LIST
export const games = [
  {
    name: "Chess",
    route: "chess",
    folder: "Chess",
    description: "Classic logic battle.",
    icon: EmojiEventsIcon,
  },
  {
    name: "Tic-Tac-Toe",
    route: "tic-tac-toe",
    folder: "TicTacToe",
    description: "X vs O, classic quick logic.",
    icon: ExtensionIcon,
  },
  {
    name: "Nokia Snake",
    route: "snake",
    folder: "Snake",
    description: "Old school, eat & grow.",
    icon: SportsEsportsIcon,
  },
  {
    name: "Sudoku",
    route: "sudoku",
    folder: "Sudoku",
    description: "Number logic puzzle.",
    icon: Grid4x4Icon,
  },
  // {
  //   name: "Ludo",
  //   route: "ludo",
  //   folder: "Ludo",
  //   description: "Race your tokens!",
  //   icon: CasinoIcon,
  // },
  {
    name: "Carrom",
    route: "carrom",
    folder: "Carrom",
    description: "Flick and pocket.",
    icon: AlbumIcon,
  },
  {
    name: "Snake & Ladder",
    route: "snake-ladder",
    folder: "SnakeLadder",
    description: "Climb up, slide down.",
    icon: RemoveCircleIcon,
  },
  {
    name: "Checkers",
    route: "checkers",
    folder: "Checkers",
    description: "Jump and crown!",
    icon: Looks3Icon,
  },
  {
    name: "Dots and Boxes",
    route: "dots-boxes",
    folder: "DotsBoxes",
    description: "Draw lines, claim boxes.",
    icon: PanoramaFishEyeIcon,
  },
  {
    name: "Connect Four",
    route: "connect-four",
    folder: "ConnectFour",
    description: "Get four-in-a-row.",
    icon: CasinoOutlinedIcon,
  },
  {
    name: "Minesweeper",
    route: "minesweeper",
    folder: "Minesweeper",
    description: "Avoid the bombs!",
    icon: AppsIcon,
  },
  {
    name: "Reversi",
    route: "reversi",
    folder: "Reversi",
    description: "Flip your opponent.",
    icon: FlipIcon,
  },
  {
    name: "Pong",
    route: "pong",
    folder: "Pong",
    description: "The original paddle game.",
    icon: RemoveCircleIcon,
  },
  {
    name: "Memory Match",
    route: "memory-match",
    folder: "MemoryMatch",
    description: "Flip cards, match pairs.",
    icon: MemoryIcon,
  },
  {
    name: "Word Search",
    route: "word-search",
    folder: "WordSearch",
    description: "Find the words.",
    icon: TextFieldsIcon,
  },
  {
    name: "Sliding Puzzle",
    route: "sliding-puzzle",
    folder: "SlidingPuzzle",
    description: "Arrange the tiles.",
    icon: ViewModuleIcon,
  },
  {
    name: "Hangman",
    route: "hangman",
    folder: "Hangman",
    description: "Guess the word.",
    icon: NotesIcon,
  },
  {
    name: "Rock Paper Scissors",
    route: "rock-paper-scissors",
    folder: "RockPaperScissors",
    description: "Classic hand game.",
    icon: LocalActivityIcon,
  },
  {
    name: "2048",
    route: "2048",
    folder: "TwoZeroFourEight",
    description: "Combine tiles, reach 2048.",
    icon: NumbersIcon,
  },
  {
    name: "Simon Says",
    route: "simon-says",
    folder: "SimonSays",
    description: "Repeat the pattern.",
    icon: WbIncandescentIcon,
  },
  {
    name: "Space Invaders",
    route: "space-invaders",
    folder: "SpaceInvaders",
    description: "Shoot down aliens.",
    icon: FlashOnIcon,
  },
  {
    name: "Brick Breaker",
    route: "brick-breaker",
    folder: "BrickBreaker",
    description: "Break the bricks.",
    icon: BlurCircularIcon,
  },
  {
    name: "Tetris",
    route: "tetris",
    folder: "Tetris",
    description: "Fit falling blocks.",
    icon: GradientIcon,
  },
  {
    name: "Sliding Maze",
    route: "sliding-maze",
    folder: "SlidingMaze",
    description: "Shift pieces to solve.",
    icon: FilterNoneIcon,
  },
  {
    name: "Maze Escape",
    route: "maze-escape",
    folder: "MazeEscape",
    description: "Find the exit.",
    icon: TimelineIcon,
  },
  {
    name: "Othello",
    route: "othello",
    folder: "Othello",
    description: "Outflank, reverse.",
    icon: FlipIcon,
  },
  {
    name: "Gomoku",
    route: "gomoku",
    folder: "Gomoku",
    description: "Line up five.",
    icon: GridOnIcon,
  },
  {
    name: "Pairs",
    route: "pairs",
    folder: "Pairs",
    description: "Match paired cards.",
    icon: MemoryIcon,
  },
  {
    name: "Lights Out",
    route: "lights-out",
    folder: "LightsOut",
    description: "All lights off!",
    icon: WbIncandescentIcon,
  },
  {
    name: "Rush Hour",
    route: "rush-hour",
    folder: "RushHour",
    description: "Unblock the car.",
    icon: DirectionsCarIcon,
  },
  {
    name: "Ball Bounce",
    route: "ball-bounce",
    folder: "BallBounce",
    description: "Bounce as long as you can.",
    icon: BubbleChartIcon,
  },
  {
    name: "Quick Math",
    route: "quick-math",
    folder: "QuickMath",
    description: "Solve fast math.",
    icon: CalculateIcon,
  },
  {
    name: "Word Ladder",
    route: "word-ladder",
    folder: "WordLadder",
    description: "Change a letter, make a word.",
    icon: TextFieldsIcon,
  },
  {
    name: "Sprinter Dice",
    route: "sprinter-dice",
    folder: "SprinterDice",
    description: "Roll dice to dash.",
    icon: CasinoIcon,
  },
  {
    name: "Balloon Pop",
    route: "balloon-pop",
    folder: "BalloonPop",
    description: "Pop the balloons.",
    icon: FilterVintageIcon,
  },
  {
    name: "Find the Difference",
    route: "find-difference",
    folder: "FindDifference",
    description: "Spot all changes.",
    icon: HighlightIcon,
  },
  {
    name: "Line Rider",
    route: "line-rider",
    folder: "LineRider",
    description: "Draw and ride lines.",
    icon: LineStyleIcon,
  },
  {
    name: "Reaction Test",
    route: "reaction-test",
    folder: "ReactionTest",
    description: "React fast, score higher!",
    icon: FlashOnIcon,
  },
  {
    name: "Jumping Square",
    route: "jumping-square",
    folder: "JumpingSquare",
    description: "Jump past obstacles.",
    icon: PanoramaVerticalIcon,
  }
];
