-- Task dependency support
--
-- Adds a single-prerequisite link between tasks. When the prerequisite task is
-- not yet completed, the dependent task is treated as Blocked / Waiting by the
-- app (src/utils/taskHealth.js -> resolveTaskBlocking).
--
-- Run this in the Supabase SQL editor (or via `supabase db push`) before using
-- the dependency picker in the task form. The frontend degrades gracefully and
-- simply hides the feature while the column is missing.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS depends_on_task_id UUID
    REFERENCES public.tasks(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tasks.depends_on_task_id IS
  'Prerequisite task. While that task is not completed, this task is Blocked/Waiting.';

-- Speeds up "which tasks does X block?" lookups.
CREATE INDEX IF NOT EXISTS tasks_depends_on_task_id_idx
  ON public.tasks (depends_on_task_id)
  WHERE depends_on_task_id IS NOT NULL;

-- Guard rails: no self-dependency, no dependency cycles, and (for the 1-level
-- model the UI exposes) the prerequisite must live in the same goal.
CREATE OR REPLACE FUNCTION public.tasks_validate_dependency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prereq_goal_id UUID;
  cursor_id UUID;
  hops INT := 0;
BEGIN
  IF NEW.depends_on_task_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.depends_on_task_id = NEW.id THEN
    RAISE EXCEPTION 'A task cannot depend on itself';
  END IF;

  SELECT goal_id INTO prereq_goal_id
  FROM public.tasks
  WHERE id = NEW.depends_on_task_id AND deleted_at IS NULL;

  IF prereq_goal_id IS NULL THEN
    RAISE EXCEPTION 'Prerequisite task % not found', NEW.depends_on_task_id;
  END IF;

  IF prereq_goal_id <> NEW.goal_id THEN
    RAISE EXCEPTION 'Prerequisite task must belong to the same goal';
  END IF;

  -- Walk the prerequisite chain; reaching NEW.id again means a cycle.
  cursor_id := NEW.depends_on_task_id;
  WHILE cursor_id IS NOT NULL AND hops < 100 LOOP
    IF cursor_id = NEW.id THEN
      RAISE EXCEPTION 'Task dependency cycle detected';
    END IF;
    SELECT depends_on_task_id INTO cursor_id FROM public.tasks WHERE id = cursor_id;
    hops := hops + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_validate_dependency_trg ON public.tasks;
CREATE TRIGGER tasks_validate_dependency_trg
  BEFORE INSERT OR UPDATE OF depends_on_task_id, goal_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.tasks_validate_dependency();
