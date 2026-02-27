import { useTranslate } from "ra-core";
import { taskFilters, isBeforeFriday } from "./taskFilters";
import { TasksListEmpty } from "../dashboard/TasksListEmpty";
import { TasksListFilter } from "../dashboard/TasksListFilter";

export const TasksListContent = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <TasksListEmpty />
      <TasksListFilter title={translate("crm.tasks.overdue")} filter={taskFilters.overdue} />
      <TasksListFilter title={translate("crm.tasks.today")} filter={taskFilters.today} />
      <TasksListFilter title={translate("crm.tasks.tomorrow")} filter={taskFilters.tomorrow} />
      {isBeforeFriday && (
        <TasksListFilter title={translate("crm.tasks.this_week")} filter={taskFilters.thisWeek} />
      )}
      <TasksListFilter title={translate("crm.tasks.later")} filter={taskFilters.later} />
    </div>
  );
};
