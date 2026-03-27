SELECT 
    m.name AS table_name,
    p.name AS column_name,
    p.type AS data_type
FROM 
    sqlite_master m
JOIN 
    pragma_table_info(m.name) p
WHERE 
    m.type = 'table'
    AND m.name NOT LIKE 'sqlite_%'
ORDER BY 
    m.name, p.cid;
