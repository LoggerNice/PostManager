-- Создание функции для автоматического изменения приоритета задач
CREATE OR REPLACE FUNCTION update_task_priority_based_on_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Проверяем, есть ли дедлайн у задачи
    IF NEW.deadline IS NOT NULL THEN
        -- Если до дедлайна остался час или меньше - ставим высокий приоритет
        IF NEW.deadline <= NOW() + INTERVAL '1 hour' THEN
            NEW.priority = 'HIGH';
        -- Если до дедлайна остался день или меньше - ставим средний приоритет
        ELSIF NEW.deadline <= NOW() + INTERVAL '1 day' THEN
            NEW.priority = 'MEDIUM';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера, который срабатывает при вставке или обновлении задачи
CREATE TRIGGER task_priority_trigger
    BEFORE INSERT OR UPDATE ON "Task"
    FOR EACH ROW
    EXECUTE FUNCTION update_task_priority_based_on_deadline();

-- Создание функции для периодического обновления приоритетов существующих задач
CREATE OR REPLACE FUNCTION update_existing_task_priorities()
RETURNS void AS $$
BEGIN
    -- Обновляем приоритеты для задач с дедлайном
    UPDATE "Task"
    SET 
        priority = CASE 
            WHEN deadline <= NOW() + INTERVAL '1 hour' THEN 'HIGH'
            WHEN deadline <= NOW() + INTERVAL '1 day' THEN 'MEDIUM'
            ELSE priority
        END,
        "updatedAt" = NOW()
    WHERE 
        deadline IS NOT NULL 
        AND status NOT IN ('COMPLETED', 'CANCELLED')
        AND (
            (deadline <= NOW() + INTERVAL '1 hour' AND priority != 'HIGH') OR
            (deadline <= NOW() + INTERVAL '1 day' AND deadline > NOW() + INTERVAL '1 hour' AND priority != 'MEDIUM')
        );
END;
$$ LANGUAGE plpgsql; 