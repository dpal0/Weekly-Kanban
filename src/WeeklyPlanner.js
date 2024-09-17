import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const WeeklyPlanner = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [currentWeek, setCurrentWeek] = useState([]);
    const [tasks, setTasks] = useState({});
    const [newTask, setNewTask] = useState('');
    const [activeDay, setActiveDay] = useState(null);

    useEffect(() => {
        const week = [];
        const taskInit = {};
        const startDate = new Date(currentWeekStart);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            week.push(day);
            const dateStr = day.toISOString().split('T')[0];
            if (!tasks[dateStr]) {
                taskInit[dateStr] = [];
            }
        }

        setCurrentWeek(week);
        setTasks(prevTasks => ({ ...prevTasks, ...taskInit }));
    }, [currentWeekStart, tasks]);

    const formatDate = (date) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const dayOfMonth = date.getDate();
        const suffix = ['th', 'st', 'nd', 'rd'][dayOfMonth % 10 > 3 ? 0 : (dayOfMonth % 100 - dayOfMonth % 10 !== 10) * dayOfMonth % 10];

        return `${dayName} ${dayOfMonth}${suffix} ${monthName} (${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')})`;
    };

    const addTask = (date) => {
        if (newTask.trim() !== '') {
            const dateStr = date.toISOString().split('T')[0];
            const taskText = newTask.trim();
            setTasks(prevTasks => ({
                ...prevTasks,
                [dateStr]: [...(prevTasks[dateStr] || []), { text: taskText, completed: false }]
            }));
            setNewTask('');
        }
    };

    const toggleTaskCompletion = (dateStr, index) => {
        setTasks(prevTasks => ({
            ...prevTasks,
            [dateStr]: prevTasks[dateStr].map((task, i) => 
                i === index ? { ...task, completed: !task.completed } : task
            )
        }));
    };

    const deleteTask = (dateStr, index) => {
        setTasks(prevTasks => ({
            ...prevTasks,
            [dateStr]: prevTasks[dateStr].filter((_, i) => i !== index)
        }));
    };

    const navigateWeek = (direction) => {
        setCurrentWeekStart(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(prevDate.getDate() + direction * 7);
            return newDate;
        });
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const sourceDate = source.droppableId;
        const destDate = destination.droppableId;

        const newTasks = { ...tasks };
        const [movedTask] = newTasks[sourceDate].splice(source.index, 1);
        newTasks[destDate].splice(destination.index, 0, movedTask);

        setTasks(newTasks);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="planner-container">
                <div className="planner-header">
                    <h1>Weekly Planner</h1>
                    <div className="navigation-buttons">
                        <button onClick={() => navigateWeek(-1)}>Previous Week</button>
                        <button onClick={() => setCurrentWeekStart(new Date())}>Current Week</button>
                        <button onClick={() => navigateWeek(1)}>Next Week</button>
                    </div>
                </div>
                <div className="week-container">
                    {currentWeek.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        return (
                            <div key={dateStr} className="day-card">
                                <div className="day-header">{formatDate(date)}</div>
                                <div className="day-content">
                                    <Droppable droppableId={dateStr}>
                                        {(provided) => (
                                            <ul
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="task-list"
                                            >
                                                {tasks[dateStr]?.map((task, index) => (
                                                    <Draggable key={`${dateStr}-${index}`} draggableId={`${dateStr}-${index}`} index={index}>
                                                        {(provided) => (
                                                            <li
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`task-item ${task.completed ? 'completed' : ''}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={task.completed}
                                                                    onChange={() => toggleTaskCompletion(dateStr, index)}
                                                                />
                                                                <span>{task.text}</span>
                                                                <button onClick={() => deleteTask(dateStr, index)}>Delete</button>
                                                            </li>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </ul>
                                        )}
                                    </Droppable>
                                    {activeDay === dateStr ? (
                                        <div className="add-task-form">
                                            <input
                                                type="text"
                                                value={newTask}
                                                onChange={(e) => setNewTask(e.target.value)}
                                                placeholder="Enter new task"
                                                onKeyDown={(e) => e.key === 'Enter' && addTask(date)}
                                            />
                                            <button onClick={() => addTask(date)}>
                                                Add Task
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setActiveDay(dateStr)} 
                                            className="add-task-button"
                                        >
                                            Add Task
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DragDropContext>
    );
}; 

export default WeeklyPlanner;