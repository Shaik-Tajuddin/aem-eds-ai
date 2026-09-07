-- Seed WKND About Us into PostgreSQL
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001';
  v_project_id UUID := '11111111-1111-1111-1111-111111111111';
  v_run_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- 1. Project
  INSERT INTO projects (id, owner_id, name, description, health, last_run_at)
  VALUES (
    v_project_id,
    v_user_id,
    'WKND About Us',
    'Adobe Edge Delivery Services migration and block modernization for WKND About Us page',
    'HEALTHY',
    NOW() - INTERVAL '12 minutes'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    health = EXCLUDED.health,
    last_run_at = EXCLUDED.last_run_at,
    updated_at = NOW();

  -- 2. Repository
  INSERT INTO repositories (project_id, provider, full_name, default_branch, is_private)
  VALUES (
    v_project_id,
    'github',
    'adobe/aem-boilerplate',
    'main',
    false
  )
  ON CONFLICT (project_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    default_branch = EXCLUDED.default_branch;

  -- 3. Environments
  INSERT INTO environments (project_id, type, name, author_url, preview_url, authoring_path)
  VALUES
    (v_project_id, 'aem', 'AEM Local Author', 'http://localhost:4502', 'https://main--wknd--hlx.page', '/content/wknd/us/en/about-us'),
    (v_project_id, 'eds-preview', 'EDS Preview CDN', 'http://localhost:4502', 'https://main--wknd--hlx.page', '/content/wknd/us/en/about-us')
  ON CONFLICT DO NOTHING;

  -- 4. Project Config
  INSERT INTO project_configs (
    project_id, source_type, source_url, llm_provider, llm_model,
    visual_threshold, accessibility_threshold, performance_threshold, max_fix_iterations
  )
  VALUES (
    v_project_id,
    'EXISTING_WEBSITE',
    'https://main--wknd--hlx.live/about-us',
    'Claude 3.5 Sonnet (Direct)',
    'claude-3-5-sonnet',
    95, 95, 90, 5
  )
  ON CONFLICT (project_id) DO UPDATE SET
    source_type = EXCLUDED.source_type,
    source_url = EXCLUDED.source_url,
    llm_provider = EXCLUDED.llm_provider,
    llm_model = EXCLUDED.llm_model;

  -- 5. Agent Run
  INSERT INTO agent_runs (
    id, project_id, status, source, source_url, branch, git_commit,
    model, provider, progress, current_stage, iteration, max_iterations,
    total_tool_calls, total_llm_calls, estimated_cost_usd, started_at, completed_at, duration_ms
  )
  VALUES (
    v_run_id,
    v_project_id,
    'COMPLETED',
    'EXISTING_WEBSITE',
    'https://main--wknd--hlx.live/about-us',
    'main',
    '7f8a92e',
    'claude-3-5-sonnet',
    'Anthropic',
    100,
    'COMPLETED',
    1,
    5,
    18,
    32,
    0.147,
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '11 minutes',
    222000
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    progress = EXCLUDED.progress;

  -- 6. Blocks
  INSERT INTO blocks (run_id, project_id, name, js_path, css_path, model_path)
  VALUES
    (v_run_id, v_project_id, 'hero', 'blocks/hero/hero.js', 'blocks/hero/hero.css', 'models/_hero.json'),
    (v_run_id, v_project_id, 'columns', 'blocks/columns/columns.js', 'blocks/columns/columns.css', 'models/_columns.json'),
    (v_run_id, v_project_id, 'cards', 'blocks/cards/cards.js', 'blocks/cards/cards.css', 'models/_cards.json'),
    (v_run_id, v_project_id, 'teaser', 'blocks/teaser/teaser.js', 'blocks/teaser/teaser.css', 'models/_teaser.json')
  ON CONFLICT DO NOTHING;

END $$;
