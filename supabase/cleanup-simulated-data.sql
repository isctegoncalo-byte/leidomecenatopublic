-- Limpeza de dados simulados / demonstração.
-- Mantém a conta admin geral@leidomecenato.pt e remove perfis de demonstração conhecidos.
-- Para apagar também os utilizadores em auth.users, execute no SQL Editor com permissões de owner.

begin;

delete from public.documents
where owner_id in (
  select id
  from public.profiles
  where lower(email) <> 'geral@leidomecenato.pt'
    and (
      lower(email) like '%@demo.pt'
      or lower(email) in (
        'geral@techglobal.pt',
        'geral@mobilipro.pt',
        'info@solverde.pt',
        'geral@construtora-atlas.pt',
        'admin@farmacia-central.pt',
        'geral@autorepara.pt',
        'geral@padariasol.pt',
        'info@designlx.pt',
        'geral@logisticapro.pt',
        'info@consultmais.pt',
        'geral@vinhosdouro.pt',
        'info@turismorural.pt',
        'geral@agroalentejo.pt',
        'geral@clinicasaude.pt',
        'info@smartbuilding.pt',
        'geral@crescerjuntos.pt',
        'geral@horizontereab.pt',
        'geral@artememoria.pt',
        'geral@raizverde.pt',
        'geral@academiainclusiva.pt',
        'geral@oceaninvest.pt',
        'geral@bancalimentar.pt',
        'geral@casadacrianca.pt',
        'geral@musicasemfronteiras.pt',
        'geral@refloresta.pt',
        'geral@apoiomaior.pt',
        'geral@codekids.pt',
        'geral@teatrosocial.pt',
        'geral@animaisemrisco.pt',
        'geral@habitacaosolidaria.pt'
      )
    )
);

delete from public.profiles
where lower(email) <> 'geral@leidomecenato.pt'
  and (
    lower(email) like '%@demo.pt'
    or lower(email) in (
      'geral@techglobal.pt',
      'geral@mobilipro.pt',
      'info@solverde.pt',
      'geral@construtora-atlas.pt',
      'admin@farmacia-central.pt',
      'geral@autorepara.pt',
      'geral@padariasol.pt',
      'info@designlx.pt',
      'geral@logisticapro.pt',
      'info@consultmais.pt',
      'geral@vinhosdouro.pt',
      'info@turismorural.pt',
      'geral@agroalentejo.pt',
      'geral@clinicasaude.pt',
      'info@smartbuilding.pt',
      'geral@crescerjuntos.pt',
      'geral@horizontereab.pt',
      'geral@artememoria.pt',
      'geral@raizverde.pt',
      'geral@academiainclusiva.pt',
      'geral@oceaninvest.pt',
      'geral@bancalimentar.pt',
      'geral@casadacrianca.pt',
      'geral@musicasemfronteiras.pt',
      'geral@refloresta.pt',
      'geral@apoiomaior.pt',
      'geral@codekids.pt',
      'geral@teatrosocial.pt',
      'geral@animaisemrisco.pt',
      'geral@habitacaosolidaria.pt'
    )
  );

update public.profiles
set role = 'admin',
    name = coalesce(nullif(name, ''), 'Admin Lei do Mecenato'),
    updated_at = now()
where lower(email) = 'geral@leidomecenato.pt';

commit;
