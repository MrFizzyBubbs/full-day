import { Engine, Quest, Task } from "grimoire-kolmafia";
import { printProfits, ProfitTracker } from "./profits";
import { userConfirm } from "kolmafia";
import { $effect, get, have, Kmail, PropertiesManager, set, uneffect } from "libram";
import { args } from "../args";
import { debug } from "../lib";

export type LoopTask = Task & { tracking?: string };
export type LoopQuest = Quest<Task>;

export class LoopEngine extends Engine<never, LoopTask> {
  profits: ProfitTracker;

  constructor(tasks: LoopTask[], completedTasks: string[], key: string) {
    const completed_set = new Set<string>(completedTasks.map((n) => n.trim()));
    // Completed tasks are always completed
    tasks = tasks.map((task) => {
      if (completed_set.has(task.name)) return { ...task, completed: () => true };
      return task;
    });
    super(tasks);
    this.profits = new ProfitTracker(key);

    for (const task of completed_set) {
      if (!this.tasks_by_name.has(task)) debug(`Warning: Unknown completedtask ${task}`);
    }
  }

  public available(task: Task): boolean {
    return !task.completed();
  }

  public run(actions?: number): void {
    for (let i = 0; i < (actions ?? Infinity); i++) {
      const task = this.getNextTask();
      if (!task) return;
      for (const after of task.after ?? []) {
        const after_task = this.tasks_by_name.get(after);
        if (after_task === undefined) throw `Unknown task dependency ${after} on ${task.name}`;
        if (!after_task.completed()) throw `Task dependency ${after} is not completed`;
      }
      if (task.ready && !task.ready()) throw `Task ${task.name} is not ready`;
      this.execute(task);
    }
  }

  execute(task: LoopTask): void {
    try {
      if (args.debug.confirm && !userConfirm(`Executing ${task.name}, continue?`)) {
        throw `User rejected execution of task ${task.name}`;
      }

      super.execute(task);
    } finally {
      const questName = task.name.split("/")[0];
      this.profits.record(`${questName}@${task.tracking ?? "Other"}`);
      this.profits.save();
    }
  }

  post(task: LoopTask): void {
    super.post(task);
    if (get("_lastCombatLost")) throw "Fight was lost; stop.";
    if (have($effect`Beaten Up`)) uneffect($effect`Beaten Up`);
  }

  destruct(): void {
    super.destruct();

    Kmail.delete(
      Kmail.inbox().filter((k) =>
        [
          "Lady Spookyraven's Ghost",
          "The Loathing Postal Service",
          "CheeseFax",
          "OnlyFax",
        ].includes(k.senderName)
      )
    );
    printProfits(this.profits.all());
  }

  initPropertiesManager(manager: PropertiesManager): void {
    super.initPropertiesManager(manager);
    manager.set({ valueOfAdventure: args.minor.voa });
    // June cleaver choices, sourced from phccs
    manager.setChoices({
      1467: 3,
      1468: 2,
      1469: 3,
      1470: 2,
      1471: 3,
      1472: 1,
      1473: 1,
      1474: 1,
      1475: 1,
    });
    set("garbo_yachtzeechain", true);
    set("garbo_candydish", true);
  }
}
