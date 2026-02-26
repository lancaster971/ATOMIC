import type { TranslationMessages } from "ra-core";

const italianMessages: TranslationMessages = {
  ra: {
    action: {
      add_filter: "Aggiungi filtro",
      add: "Aggiungi",
      back: "Indietro",
      bulk_actions:
        "1 elemento selezionato |||| %{smart_count} elementi selezionati",
      cancel: "Annulla",
      clear_array_input: "Svuota la lista",
      clear_input_value: "Cancella valore",
      clone: "Duplica",
      confirm: "Conferma",
      create: "Crea",
      create_item: "Crea %{item}",
      delete: "Elimina",
      edit: "Modifica",
      export: "Esporta",
      list: "Lista",
      refresh: "Aggiorna",
      remove_filter: "Rimuovi questo filtro",
      remove_all_filters: "Rimuovi tutti i filtri",
      remove: "Rimuovi",
      reset: "Ripristina",
      save: "Salva",
      search: "Cerca",
      search_columns: "Cerca colonne",
      select_all: "Seleziona tutti",
      select_all_button: "Seleziona tutti",
      select_row: "Seleziona questa riga",
      show: "Mostra",
      sort: "Ordina",
      undo: "Annulla",
      unselect: "Deseleziona",
      expand: "Espandi",
      close: "Chiudi",
      open_menu: "Apri menu",
      close_menu: "Chiudi menu",
      update: "Aggiorna",
      move_up: "Sposta su",
      move_down: "Sposta gi\u00f9",
      open: "Apri",
      toggle_theme: "Cambia tema chiaro/scuro",
      select_columns: "Colonne",
      update_application: "Ricarica applicazione",
    },
    boolean: {
      true: "S\u00ec",
      false: "No",
      null: " ",
    },
    page: {
      create: "Crea %{name}",
      dashboard: "Dashboard",
      edit: "%{name} %{recordRepresentation}",
      error: "Qualcosa \u00e8 andato storto",
      list: "%{name}",
      loading: "Caricamento",
      not_found: "Non trovato",
      show: "%{name} %{recordRepresentation}",
      empty: "Nessun %{name} presente.",
      invite: "Vuoi aggiungerne uno?",
      access_denied: "Accesso negato",
      authentication_error: "Errore di autenticazione",
    },
    input: {
      file: {
        upload_several:
          "Trascina dei file per caricarli, oppure clicca per selezionarli.",
        upload_single:
          "Trascina un file per caricarlo, oppure clicca per selezionarlo.",
      },
      image: {
        upload_several:
          "Trascina delle immagini per caricarle, oppure clicca per selezionarle.",
        upload_single:
          "Trascina un'immagine per caricarla, oppure clicca per selezionarla.",
      },
      references: {
        all_missing: "Impossibile trovare i dati di riferimento.",
        many_missing:
          "Almeno uno dei riferimenti associati non sembra pi\u00f9 disponibile.",
        single_missing:
          "Il riferimento associato non sembra pi\u00f9 disponibile.",
      },
      password: {
        toggle_visible: "Nascondi password",
        toggle_hidden: "Mostra password",
      },
    },
    message: {
      about: "Informazioni",
      access_denied:
        "Non hai i permessi necessari per accedere a questa pagina",
      are_you_sure: "Sei sicuro?",
      authentication_error:
        "Il server di autenticazione ha restituito un errore e le tue credenziali non possono essere verificate.",
      auth_error:
        "Si \u00e8 verificato un errore durante la validazione del token di autenticazione.",
      bulk_delete_content:
        "Sei sicuro di voler eliminare questo %{name}? |||| Sei sicuro di voler eliminare questi %{smart_count} elementi?",
      bulk_delete_title:
        "Elimina %{name} |||| Elimina %{smart_count} %{name}",
      bulk_update_content:
        "Sei sicuro di voler aggiornare %{name} %{recordRepresentation}? |||| Sei sicuro di voler aggiornare questi %{smart_count} elementi?",
      bulk_update_title:
        "Aggiorna %{name} %{recordRepresentation} |||| Aggiorna %{smart_count} %{name}",
      clear_array_input: "Sei sicuro di voler svuotare l'intera lista?",
      delete_content: "Sei sicuro di voler eliminare questo %{name}?",
      delete_title: "Elimina %{name} %{recordRepresentation}",
      details: "Dettagli",
      error:
        "Si \u00e8 verificato un errore e la tua richiesta non pu\u00f2 essere completata.",
      invalid_form:
        "Il modulo non \u00e8 valido. Controlla se ci sono errori",
      loading: "Attendere prego",
      no: "No",
      not_found: "Hai digitato un URL errato o seguito un link non valido.",
      select_all_limit_reached:
        "Ci sono troppi elementi per selezionarli tutti. Solo i primi %{max} elementi sono stati selezionati.",
      unsaved_changes:
        "Alcune modifiche non sono state salvate. Sei sicuro di volerle ignorare?",
      yes: "S\u00ec",
      placeholder_data_warning:
        "Problema di rete: aggiornamento dati non riuscito.",
    },
    navigation: {
      clear_filters: "Cancella filtri",
      no_filtered_results:
        "Nessun %{name} trovato con i filtri attuali.",
      no_results: "Nessun %{name} trovato",
      no_more_results:
        "La pagina %{page} non esiste. Prova la pagina precedente.",
      page_out_of_boundaries: "Pagina %{page} fuori dai limiti",
      page_out_from_end: "Non puoi andare oltre l'ultima pagina",
      page_out_from_begin: "Non puoi andare prima della pagina 1",
      page_range_info: "%{offsetBegin}-%{offsetEnd} di %{total}",
      partial_page_range_info:
        "%{offsetBegin}-%{offsetEnd} di pi\u00f9 di %{offsetEnd}",
      current_page: "Pagina %{page}",
      page: "Vai alla pagina %{page}",
      first: "Vai alla prima pagina",
      last: "Vai all'ultima pagina",
      next: "Vai alla pagina successiva",
      previous: "Vai alla pagina precedente",
      page_rows_per_page: "Righe per pagina:",
      skip_nav: "Vai al contenuto",
    },
    sort: {
      sort_by: "Ordina per %{field_lower_first} %{order}",
      ASC: "crescente",
      DESC: "decrescente",
    },
    auth: {
      auth_check_error: "Effettua il login per continuare",
      user_menu: "Profilo",
      username: "Nome utente",
      password: "Password",
      email: "Email",
      sign_in: "Accedi",
      sign_in_error: "Autenticazione fallita, riprova",
      logout: "Esci",
    },
    notification: {
      updated:
        "Elemento aggiornato |||| %{smart_count} elementi aggiornati",
      created: "Elemento creato",
      deleted:
        "Elemento eliminato |||| %{smart_count} elementi eliminati",
      bad_item: "Elemento non corretto",
      item_doesnt_exist: "L'elemento non esiste",
      http_error: "Errore di comunicazione con il server",
      data_provider_error:
        "Errore del dataProvider. Controlla la console per i dettagli.",
      i18n_error:
        "Impossibile caricare le traduzioni per la lingua selezionata",
      canceled: "Azione annullata",
      logged_out: "La sessione \u00e8 terminata, effettua nuovamente l'accesso.",
      not_authorized: "Non sei autorizzato ad accedere a questa risorsa.",
      application_update_available:
        "\u00c8 disponibile una nuova versione.",
      offline:
        "Nessuna connessione. Impossibile recuperare i dati.",
    },
    validation: {
      required: "Obbligatorio",
      minLength: "Deve essere di almeno %{min} caratteri",
      maxLength: "Deve essere di %{max} caratteri o meno",
      minValue: "Deve essere almeno %{min}",
      maxValue: "Deve essere %{max} o meno",
      number: "Deve essere un numero",
      email: "Deve essere un'email valida",
      oneOf: "Deve essere uno tra: %{options}",
      regex:
        "Deve corrispondere a un formato specifico (regexp): %{pattern}",
      unique: "Deve essere unico",
    },
    saved_queries: {
      label: "Ricerche salvate",
      query_name: "Nome ricerca",
      new_label: "Salva ricerca corrente...",
      new_dialog_title: "Salva ricerca corrente come",
      remove_label: "Rimuovi ricerca salvata",
      remove_label_with_name: 'Rimuovi ricerca "%{name}"',
      remove_dialog_title: "Rimuovere la ricerca salvata?",
      remove_message:
        "Sei sicuro di voler rimuovere questa ricerca dalla lista delle ricerche salvate?",
      help: "Filtra la lista e salva questa ricerca per dopo",
    },
    configurable: {
      customize: "Personalizza",
      configureMode: "Configura questa pagina",
      inspector: {
        title: "Ispettore",
        content:
          "Passa il mouse sugli elementi dell'interfaccia per configurarli",
        reset: "Ripristina impostazioni",
        hideAll: "Nascondi tutti",
        showAll: "Mostra tutti",
      },
      Datagrid: {
        title: "Tabella dati",
        unlabeled: "Colonna senza etichetta #%{column}",
      },
      SimpleForm: {
        title: "Modulo",
        unlabeled: "Campo senza etichetta #%{input}",
      },
      SimpleList: {
        title: "Lista",
        primaryText: "Testo principale",
        secondaryText: "Testo secondario",
        tertiaryText: "Testo terziario",
      },
    },
  },
};

export default italianMessages;
