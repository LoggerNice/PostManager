-- Удаляем существующий триггер и функцию
DROP TRIGGER IF EXISTS task_priority_trigger ON "Task";
DROP FUNCTION IF EXISTS update_task_priority_based_on_deadline();

-- Создание новой функции для автоматического изменения приоритета задач
CREATE OR REPLACE FUNCTION update_task_priority_based_on_deadline()
RETURNS TRIGGER AS $$
DECLARE
    hours_until_deadline DECIMAL;
BEGIN
    -- Проверяем, есть ли дедлайн у задачи
    IF NEW.deadline IS NOT NULL THEN
        -- Вычисляем количество часов до дедлайна (более точное вычисление)
        hours_until_deadline := EXTRACT(EPOCH FROM (NEW.deadline - NOW())) / 3600;
        
        -- Если до дедлайна осталось 24 часа или меньше - ставим высокий приоритет
        IF hours_until_deadline <= 24 THEN
            NEW.priority = 'HIGH';
        -- Если до дедлайна осталось 48 часов или меньше - ставим средний приоритет
        ELSIF hours_until_deadline <= 48 THEN
            NEW.priority = 'MEDIUM';
        -- Иначе оставляем текущий приоритет или устанавливаем низкий
        ELSE
            IF NEW.priority IS NULL THEN
                NEW.priority = 'LOW';
            END IF;
        END IF;
        
        -- Логируем для отладки
        RAISE NOTICE 'Task deadline: %, hours until deadline: %, calculated priority: %', 
            NEW.deadline, hours_until_deadline, NEW.priority;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера, который срабатывает при вставке или обновлении задачи
CREATE TRIGGER task_priority_trigger
    BEFORE INSERT OR UPDATE ON "Task"
    FOR EACH ROW
    EXECUTE FUNCTION update_task_priority_based_on_deadline();

-- Удаляем старую функцию обновления приоритетов
DROP FUNCTION IF EXISTS update_existing_task_priorities();

-- Создание новой функции для периодического обновления приоритетов существующих задач
CREATE OR REPLACE FUNCTION update_existing_task_priorities()
RETURNS void AS $$
DECLARE
    task_record RECORD;
    hours_until_deadline DECIMAL;
    new_priority "TaskPriority";
    updated_count INTEGER := 0;
BEGIN
    -- Обновляем приоритеты для задач с дедлайном
    FOR task_record IN 
        SELECT id, deadline, priority 
        FROM "Task" 
        WHERE deadline IS NOT NULL 
        AND status NOT IN ('COMPLETED', 'CANCELLED')
    LOOP
        -- Вычисляем количество часов до дедлайна
        hours_until_deadline := EXTRACT(EPOCH FROM (task_record.deadline - NOW())) / 3600;
        
        -- Определяем новый приоритет
        IF hours_until_deadline <= 24 THEN
            new_priority := 'HIGH';
        ELSIF hours_until_deadline <= 48 THEN
            new_priority := 'MEDIUM';
        ELSE
            new_priority := 'LOW';
        END IF;
        
        -- Обновляем приоритет только если он изменился
        IF new_priority != task_record.priority THEN
            UPDATE "Task"
            SET 
                priority = new_priority,
                "updatedAt" = NOW()
            WHERE id = task_record.id;
            
            updated_count := updated_count + 1;
            
            -- Логируем обновление
            RAISE NOTICE 'Updated task %: priority changed from % to % (hours until deadline: %)', 
                task_record.id, task_record.priority, new_priority, hours_until_deadline;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % tasks priorities', updated_count;
END;
$$ LANGUAGE plpgsql; 