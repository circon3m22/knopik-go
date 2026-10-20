-- Extend the existing private gateway without changing authorization or grants.
-- Protocol 5/6 rooms remain usable by their existing clients; protocol7 is matched separately.
do $migration$
declare signature text;source text;
begin
 foreach signature in array array[
  'private.knopik_go_coop_setup(text,uuid,text,integer,jsonb)',
  'private.knopik_go_coop_command(text,text,uuid)',
  'private.knopik_go_coop_advance(text,uuid,integer)'
 ] loop
  source:=pg_get_functiondef(signature::regprocedure);
  if signature like '%setup%' then
   if strpos(source,'''hunter'',''glacier''')=0 then raise exception 'Unexpected skin validator';end if;
   source:=replace(source,'''hunter'',''glacier''','''hunter'',''glacier'',''explorer''');
   source:=replace(source,'''5''::jsonb,''6''::jsonb','''5''::jsonb,''6''::jsonb,''7''::jsonb');
   source:=replace(source,'if client_protocol=6 then','if client_protocol in (6,7) then');
  else
   if strpos(source,'not in (5,6)')=0 then raise exception 'Unexpected protocol gateway';end if;
   source:=replace(source,'not in (5,6)','not in (5,6,7)');
  end if;
  execute source;
 end loop;
end;$migration$;
