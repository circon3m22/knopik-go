-- SKYLINE 0.5.0: protocol 5 and the new validated skin/boots. Existing rooms,
-- saves, permissions and security-definer paths are preserved.
do $skyline$
declare fn regprocedure; source text;
begin
 foreach fn in array array[
  'private.knopik_go_coop_setup(text,uuid,text,integer,jsonb)'::regprocedure,
  'private.knopik_go_coop_command(text,text,uuid)'::regprocedure,
  'private.knopik_go_coop_advance(text,uuid,integer)'::regprocedure
 ] loop
  source:=pg_get_functiondef(fn);
  if strpos(source,'''sky-boots''')=0 then
   source:=replace(source,'''raven-mask'',''hunter-cloak''','''raven-mask'',''hunter-cloak'',''sky-boots''');
  end if;
  if strpos(source,'''glacier''')=0 then
   source:=replace(source,'''shiba-black'',''hunter''','''shiba-black'',''hunter'',''glacier''');
  end if;
  source:=replace(source,'protocol<>4','protocol<>5');
  source:=replace(source,'protocol:=4','protocol:=5');
  execute source;
 end loop;
end;
$skyline$;
