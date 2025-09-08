-- Функция для автоматического обновления приоритетов задач на основе дедлайнов
CREATE OR REPLACE FUNCTION update_existing_task_priorities()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    today_date DATE := CURRENT_DATE;
    tomorrow_date DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
    -- Обновляем приоритет для задач с дедлайном сегодня (HIGH)
    UPDATE "Task" 
    SET priority = 'HIGH'
    WHERE deadline IS NOT NULL 
      AND DATE(deadline) = today_date
      AND priority != 'HIGH'
      AND status NOT IN ('COMPLETED', 'CANCELLED');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Обновляем приоритет для задач с дедлайном завтра (MEDIUM)
    UPDATE "Task" 
    SET priority = 'MEDIUM'
    WHERE deadline IS NOT NULL 
      AND DATE(deadline) = tomorrow_date
      AND priority NOT IN ('HIGH', 'MEDIUM')
      AND status NOT IN ('COMPLETED', 'CANCELLED');
    
    GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для определения приоритета задачи на основе дедлайна
CREATE OR REPLACE FUNCTION get_task_priority_by_deadline(task_deadline TIMESTAMP)
RETURNS TEXT AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    tomorrow_date DATE := CURRENT_DATE + INTERVAL '1 day';
    deadline_date DATE;
BEGIN
    IF task_deadline IS NULL THEN
        RETURN 'LOW';
    END IF;
    
    deadline_date := DATE(task_deadline);
    
    IF deadline_date = today_date THEN
        RETURN 'HIGH';
    ELSIF deadline_date = tomorrow_date THEN
        RETURN 'MEDIUM';
    ELSE
        RETURN 'LOW';
    END IF;
END;
$$ LANGUAGE plpgsql;
