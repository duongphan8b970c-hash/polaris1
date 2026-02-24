import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../../hooks/goals/useGoals'
import { useTasks } from '../../hooks/goals/useTasks'
import TaskList from '../../components/goals/TaskList'
import TaskForm from '../../components/goals/TaskForm'
import GoalForm from '../../components/goals/GoalForm'
import AssignmentHistory from '../../components/goals/AssignmentHistory' // ✅ ADD
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'

export default function GoalDetails() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  const { goals, loading: goalsLoading, updateGoal } = useGoals()
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks(goalId)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('tasks') // ✅ ADD: 'tasks' | 'history'

  const goal = goals.find(g => g.id === goalId)

  if (goalsLoading || tasksLoading) {
    return <Loading message="Loading goal details..." />
  }

  if (!goal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Goal not found</p>
        <button onClick={() => navigate('/goals')} className="btn btn-primary mt-4">
          ← Back to Goals
        </button>
      </div>
    )
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleSubmitTask = async (taskData) => {
    const result = editingTask
      ? await updateTask(editingTask.id, taskData)
      : await createTask({ ...taskData, goal_id: goalId })
    
    if (result.success) {
      setShowTaskForm(false)
      setEditingTask(null)
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleUpdateGoal = async (goalData) => {
    const result = await updateGoal(goalId, goalData)
    if (result.success) {
      setShowGoalForm(false)
    } else {
      alert('Error: ' + result.error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/goals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">{goal.icon}</span>
              {goal.name}
            </h1>
            {goal.description && (
              <p className="text-gray-600 mt-1">{goal.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowGoalForm(true)}
          className="btn btn-outline"
        >
          Edit Goal
        </button>
      </div>

      {/* ✅ ADD: Tabs */}
      <div className="card mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'tasks'
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📜 Assignment History
          </button>
        </div>

        {/* ✅ ADD: Tab Content */}
        <div className="p-6">
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Tasks</h2>
                <button onClick={handleCreateTask} className="btn btn-primary btn-sm">
                  + Add Task
                </button>
              </div>
              <TaskList
                tasks={tasks}
                onEdit={handleEditTask}
                onDelete={deleteTask}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <AssignmentHistory 
              resourceType="goal" 
              resourceId={goalId} 
            />
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <Modal
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false)
          setEditingTask(null)
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
      >
        <TaskForm
          task={editingTask}
          goalId={goalId}
          onSubmit={handleSubmitTask}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(null)
          }}
        />
      </Modal>

      {/* Goal Form Modal */}
      <Modal
        isOpen={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        title="Edit Goal"
      >
        <GoalForm
          goal={goal}
          onSubmit={handleUpdateGoal}
          onCancel={() => setShowGoalForm(false)}
        />
      </Modal>
    </div>
  )
}