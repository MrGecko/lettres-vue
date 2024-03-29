import {http_with_auth} from '@/modules/http-common';
import Vue from 'vue';

import {
  getPersons, getLanguages, getWitnesses,
  getNotes, getCollections, getCurrentLock,  getPlacenames,
  removeContentEditableAttributesFromObject
} from '@/modules/document-helpers';

import {getInstitution} from '../witnesses'

const TRANSLATION_MAPPING = {
  'is-published': 'du Statut de publication',
  'argument': 'de l\'Analyse',
  'transcription': 'de la Transcription',
  'title': 'du Titre',
  'address': 'de l\'Adresse'
};/*'creation' : 'Date de création',
  'creation-not-after' : 'Date de création (borne supérieure)',
  'creation-label' : 'Date de création (étiquette)',*/

const placenameRegexp = /(?:class="placeName" (?:target="_blank" href="[^>]*".)?id=")(\d+)/gmi;
const personRegexp = /(?:class="persName" (?:target="_blank" href="[^>]*".)?id=")(\d+)/gmi;
const noteRegexp = /(?:class="note" href="#(\d+)")/gmi;

const state = {
  documentLoading: false,
  document: null,
  persons: [],
  placenames: [],
  witnesses: [],
  languages: [],
  collections: [],
  notes: [],
  currentLock: {}
};
const initial_State = {

  documentLoading: false,
  document: null,
  persons: [],
  placenames: [],
  witnesses: [],
  languages: [],
  collections: [],
  notes: [],
  currentLock: {}
};



function makeDummyDocument(data) {
  let DUMMY_DOCUMENT = {
    data: {
      id: -1,
      type: 'document',
      attributes: {
        title: 'Ceci est le titre du nouveau document. Éditez-le !',
      },
    }
  };
  if (data) {
    if (data.attributes) {
      DUMMY_DOCUMENT.data.attributes = {
        ...DUMMY_DOCUMENT.data.attributes,
        ...data.attributes
      }
    }
    if (data.relationships) {
      DUMMY_DOCUMENT.data.relationships = {
        ...DUMMY_DOCUMENT.data.relationships,
        ...data.relationships
      }
    }
  }
  return DUMMY_DOCUMENT;
}

const dummy = makeDummyDocument();

const mutations = {
  RESET_DOCUMENT_STATE(state, initial_State) {
    Object.assign(state, initial_State);
    console.log('RESET_DOCUMENT_STATE', initial_State)
  },

  UPDATE_DOCUMENT (state, {data, included}) {
    console.log('UPDATE_DOCUMENT', data, included);
    state.document = Object.assign({}, state.document, { ...data.attributes, id: data.id});
    state.persons = included.persons;
    state.placenames = included.placenames;
    state.collections = included.collections;
    state.languages = included.languages;
    state.witnesses = included.witnesses;
    state.notes = included.notes;
    state.currentLock = included.currentLock;
  },
  UPDATE_DOCUMENT_DATA (state, data) {
    console.log('UPDATE_DOCUMENT_DATA', data);
    state.document = Object.assign({}, { ...data.attributes, id: data.id});
  },

  LOADING_STATUS (state, payload) {
    state.documentLoading = payload;
  },

  UPDATE_NOTE (state, payload) {
    let no = state.notes.find(n => n.id === payload.id)
    const index = state.notes.indexOf(no)
    no = { ...payload }
    state.notes.splice(index, 1, no)
    console.log("UPDATE_NOTE state.notes", state.notes)
  },
  ADD_NOTE (state, payload) {
    const exists = state.notes.find(note => note.id === payload.id)
    if (exists) {
      console.log("exists")
      return
    }
    const before = state.notes.length;
    state.notes = [ ...state.notes, payload ]
    console.log("ADD_NOTE state.notes", state.notes)
  },
  REMOVE_NOTE (state, payload) {
    let note = state.notes.find(n => n.id === payload)
    const index = state.notes.indexOf(note)
    state.notes.splice(index, 1)
  },
  UPDATE_WITNESS (state, payload) {
    let wit = state.witnesses.find(w => w.id === payload.id)
    const index = state.witnesses.indexOf(wit)
    wit = { ...payload }
    state.witnesses.splice(index, 1, wit)
  },
  REMOVE_WITNESS (state, id) {
    let wit = state.witnesses.find(w => w.id === id)
    const index = state.witnesses.indexOf(wit)
    state.witnesses.splice(index, 1)
  },
  UPDATE_WITNESS_INSTITUTION (state, { witnessId, institution }) {
    let wit = state.witnesses.find(w => w.id === witnessId)
    const index = state.witnesses.indexOf(wit)
    wit = { ...wit, institution }
    state.witnesses.splice(index, 1, wit)
  },
  REORDER_WITNESSES (state, payload) {
    Vue.set(state, 'witnesses', [ ...payload ])
  },
  REMOVE_DOCUMENT (state, payload) {
    if (state.documents) {
      state.documents = state.documents.filter(doc => doc.id !== payload.id)
    }
  },
  REMOVE_PERSON (state, payload) {
    if (state.persons) {
      state.persons = state.persons.filter(corr => corr.relation.id !== payload)
    }
  },
  ADD_PERSON (state, payload) {
    state.persons = [ ...state.persons, payload ]
  },
  REMOVE_PLACENAME(state, payload) {
    if (state.placenames) {
      state.placenames = state.placenames.filter(corr => corr.relation.id !== payload)
    }
  },
  ADD_PLACENAME(state, payload) {
    state.placenames = [...state.placenames, payload]
  }
};

const actions = {
  resetDocumentState({commit}) {
    commit('RESET_DOCUMENT_STATE', initial_State);
  },

  fetch ({ rootState, commit }, id) {
    commit('LOADING_STATUS', true);

    const http = http_with_auth(rootState.user.jwt);
    return http.get(`documents/${id}?facade=front&without-relationships`).then( response => {
      const {languages, witnesses, collections, currentLock, persons, placenames, notes, ...attributes} = response.data.data.attributes;
      //console.log("document index fetch filtered attributes", attributes)
      const data = { attributes, id: response.data.data.id};
      const included = {languages, witnesses, collections, currentLock, persons, placenames, notes}
      commit('UPDATE_DOCUMENT', {
        data: data,
        included: included
      });
      commit('LOADING_STATUS', false)
      });
  },

  async save ({ commit, state, rootState, dispatch }, data) {
    const http = http_with_auth(rootState.user.jwt);
    let track_topic = "";
    if (data['changelog_msg']) {
      track_topic = data['changelog_msg'];
      delete data['changelog_msg'];
    }
    const modifiedData = data.attributes || data.relationships;
    console.log('document/save', data)
    data.type = 'document';
    removeContentEditableAttributesFromObject(data.attributes)
    
    // check that dates are null rather than empty strings
    if (data.attributes)
    {
      if (data.attributes['creation'] && data.attributes['creation'].trim() === '') {
        data.attributes['creation'] =  null;
      }
      if (data.attributes['creation-not-after'] && data.attributes['creation-not-after'].trim() === '') {
        data.attributes['creation-not-after'] =  null;
      }
      if (data.attributes['creation-label'] && data.attributes['creation-label'].trim() === '') {
        data.attributes['creation-label'] =  null;
      }
    } 

    const response = await http.patch(`/documents/${data.id}`, { data })
    commit('UPDATE_DOCUMENT_DATA', response.data.data);
    let returnedResponse = response.status

    console.log('@@saving inlined: seeking for tags in content')
    /* 
      seek for placenames and persons in the doc attributes (address, argument, transcription and notes) 
      and update the placename_has_role and person_has_role tables accordingly. 
    */

    const attrs = response.data.data.attributes;

    /* =========== find placenames =========== */
    let IdsInAddress= attrs.address ? [...attrs.address.matchAll(placenameRegexp)].map(m => parseInt(m[1])) : []
    let IdsInArgument = attrs.argument ? [...attrs.argument.matchAll(placenameRegexp)].map(m => parseInt(m[1])) : []
    let IdsInTranscription = attrs.transcription ? [...attrs.transcription.matchAll(placenameRegexp)].map(m => parseInt(m[1])) : []

    let noteContents = state.notes.map(n => n.content)
    let IdsInNotes = []
    noteContents.forEach(n => {
      IdsInNotes = IdsInNotes.concat([...n.matchAll(placenameRegexp)].map(m => parseInt(m[1])))
    })

    let uniqIds = [... new Set(IdsInAddress.concat(IdsInArgument).concat(IdsInTranscription).concat(IdsInNotes))]
    let inlined = {}
    
    for (let _id of uniqIds) {
      let field = []

      if (IdsInAddress.indexOf(_id) > -1) {
        field.push("address")
      }
      if (IdsInArgument.indexOf(_id) > -1) {
        field.push("argument")
      }
      if (IdsInNotes.indexOf(_id) > -1) {
        field.push("note")
      }
      if (IdsInTranscription.indexOf(_id) > -1) {
        field.push("transcription")
      }

      inlined[parseInt(_id)] = field.join(',')
    }
    console.log('@@saving inlined placenames:', inlined);
    //await this.dispatch("placenames/fetchRoles");

    // s'il y a des matches
    // ajout / mise à jour / suppression
    if (IdsInTranscription.length > 0 || IdsInAddress.length > 0) {
      await this.dispatch('placenames/updateInlinedRole', {inlined})
    }
    let placenamesHavingRoles = await http.get(`/documents/${rootState.document.document.id}/placenames-having-roles`);
    let inlinedRole = rootState.placenames.roles.find(r => r.label === 'inlined')
    placenamesHavingRoles.data.data.forEach(async phr => {
        console.log(`looking if phr ${phr.id} is still in `)
        if (!inlined[phr.relationships.placename.data.id] && phr.relationships['placename-role'].data.id === inlinedRole.id) {
            console.log(`phr ${phr.id} no longer exists in inlined data (argument, address, transcription, notes), so delete it`)
            await http.delete(`/placenames-having-roles/${phr.id}`)
        }
    })

    /* =========== find persons =========== */
    IdsInAddress = attrs.address ? [...attrs.address.matchAll(personRegexp)].map(m => parseInt(m[1])) : []
    IdsInArgument = attrs.argument ? [...attrs.argument.matchAll(personRegexp)].map(m => parseInt(m[1])) : []
    IdsInTranscription = attrs.transcription ? [...attrs.transcription.matchAll(personRegexp)].map(m => parseInt(m[1])) : []
    console.log("IdsInAddress match : ", attrs.address ? [...attrs.address.matchAll(personRegexp)] : "None")
    console.log("IdsInAddress map : ", IdsInAddress)

    console.log("IdsInTranscription match : ", attrs.transcription ? [...attrs.transcription.matchAll(personRegexp)] : "None" )
    console.log("IdsInTranscription map : ", IdsInTranscription)

    IdsInNotes = []
    noteContents.forEach(n => {
      IdsInNotes = IdsInNotes.concat([...n.matchAll(personRegexp)].map(m => parseInt(m[1])))
    })
    uniqIds = [... new Set(IdsInAddress.concat(IdsInArgument).concat(IdsInTranscription).concat(IdsInNotes))]
    inlined = {}
    
    for (let _id of uniqIds) {
      let field = []

      if (IdsInAddress.indexOf(_id) > -1) {
        field.push("address")
      }
      if (IdsInArgument.indexOf(_id) > -1) {
        field.push("argument")
      }
      if (IdsInNotes.indexOf(_id) > -1) {
        field.push("note")
      }
      if (IdsInTranscription.indexOf(_id) > -1) {
        field.push("transcription")
      }

      inlined[parseInt(_id)] = field.join(',')
    }
    console.log('@@saving inlined persons:', inlined);
    await this.dispatch("persons/fetchRoles");
    
    // s'il y a des matches
    // ajout / mise à jour / suppression
    if (IdsInTranscription.length > 0 || IdsInAddress.length > 0) {
      await this.dispatch('persons/updateInlinedRole', {inlined})
    }

    let  personsHavingRoles = await http.get(`/documents/${rootState.document.document.id}/persons-having-roles`);
    inlinedRole = rootState.persons.roles.find(r => r.label === 'inlined')
    personsHavingRoles.data.data.forEach(async phr => {
        console.log(`looking if phr ${phr.id} is still in `)
        if (!inlined[phr.relationships.person.data.id] && phr.relationships['person-role'].data.id === inlinedRole.id) {
            console.log(`phr ${phr.id} no longer exists in inlined data (argument, transcription), so delete it`)
            await http.delete(`/persons-having-roles/${phr.id}`)
        }
    })

    /* =========== find notes =========== */
    let IdsInTitle = attrs.title ? [...attrs.title.matchAll(noteRegexp)].map(m => parseInt(m[1])) : []
    IdsInAddress = attrs.address ? [...attrs.address.matchAll(noteRegexp)].map(m => parseInt(m[1])) : []
    IdsInArgument = attrs.argument ? [...attrs.argument.matchAll(noteRegexp)].map(m => parseInt(m[1])) : []
    IdsInTranscription = attrs.transcription ? [...attrs.transcription.matchAll(noteRegexp)].map(m => parseInt(m[1])) : []

    console.log("Note IdsInTitle match : ", [...attrs.title.matchAll(noteRegexp)])
    console.log("Note IdsInTitle map : ", [...attrs.title.matchAll(noteRegexp)].map(m => parseInt(m[1])))

    console.log("Note IdsInAddress match : ", attrs.address ? [...attrs.address.matchAll(noteRegexp)] : "none")
    console.log("Note IdsInAddress map : ", attrs.address ? [...attrs.address.matchAll(noteRegexp)].map(m => parseInt(m[1])) : "none")

    console.log("Note IdsInAddress match : ", attrs.argument ? [...attrs.argument.matchAll(noteRegexp)] : "none")
    console.log("Note IdsInAddress map : ", attrs.argument ? [...attrs.argument.matchAll(noteRegexp)].map(m => parseInt(m[1])) : "none")

    console.log("Note IdsInTranscription match : ", attrs.transcription ? [...attrs.transcription.matchAll(noteRegexp)] : "none")
    console.log("Note IdsInTranscription map : ", attrs.transcription ? [...attrs.transcription.matchAll(noteRegexp)].map(m => parseInt(m[1])) : "none")

    let notesList = IdsInTitle.concat(IdsInAddress, IdsInArgument, IdsInTranscription)
    let notesDict = {}
    notesDict = Array.from(new Set(notesList)).map((value) => {
      return {
        id: value,
        type: 'note',
        occurences: notesList.filter((val) => val === value).length,
      }
    })
    console.log("notes dict: ", notesDict)
    if (Object.entries(notesDict).length > 0) {
      [notesDict].forEach(note => {
        console.log("document/updateNote forEarch note", note[0])
        this.dispatch("document/updateNote", note[0]).then((storeNote) => {
          console.log("Save doc / Updated Note", storeNote);
        })
      })
    }

    // track changes
    if (state.document.id !== dummy.data.id) {
      let msg = null;
      /*if (modifiedData && modifiedData.length > 0) {
        console.log("modifiedData && modifiedData.length > 0", track_topic, modifiedData, modifiedData.length)
        msg = `Modification de ${Object.keys(modifiedData).map(
          d => `'${TRANSLATION_MAPPING[d] ? TRANSLATION_MAPPING[d] : d}'`
        ).join(', ')}`;
      }*/
      if (modifiedData && !Object.values(modifiedData).every(x => x == null || x === '')) {
        //console.log("modifiedData && !Object.values(modifiedData).every(x => x == null || x === '')", track_topic, modifiedData, Object.keys(modifiedData).length)
        if (Object.keys(modifiedData).some((k) => Object.hasOwn(TRANSLATION_MAPPING, k))) {
          msg = `Modification ${Object.keys(modifiedData).map(
            d => TRANSLATION_MAPPING[d] ? TRANSLATION_MAPPING[d] : false
          ).filter(Boolean).join(', ')}`;
        }
      }
      console.log("changelog track_topic", track_topic)
      if (track_topic){
        msg = track_topic
        console.log("track_topic msg", track_topic, msg)
      }
      console.log("dispatch changelog")
      if (Array.isArray(msg)) {
        msg.forEach((m) => {
          this.dispatch("changelog/trackChanges", {
            objId: state.document.id,
            objType: 'document',
            userId: rootState.user.current_user.id,
            msg: m
          }).then(() => {
            //console.log("changelog updated")
          }).catch(() => {
            console.log("changelog not updated (", m,")")
          });
        })
      } else {
        this.dispatch('changelog/trackChanges', {
          objId: state.document.id,
          objType: 'document',
          userId: rootState.user.current_user.id,
          msg: msg
        });
      }
    } 
    return returnedResponse
  },

  add({commit, rootState, state}) {
    const http = http_with_auth(rootState.user.jwt);
    const attributes = JSON.parse(JSON.stringify(state.document));
    delete(attributes.id);
    delete(attributes['iiif-collection-url']);
    delete(attributes['iiif-base-witness-manifest-url']);
    delete(attributes['iiif-thumbnail-url']);
    if (!state.collections || state.collections.length == 0) {
      this.dispatch('collections/fetchAll')
    }
    const newDocument = {
      data: {
        type : 'document',
        attributes: {
          ...attributes
        },
        relationships: {
          collections: {
            data: state.collections ? state.collections.map(c => {return {id: c.id, type: 'collection'}}) : [{id: 4, type: 'collection'}]
          }
        }
      }
    };

    console.warn('posting', newDocument);

    return http.post(`/documents`, newDocument)
        .then(response => {
          commit('UPDATE_DOCUMENT_DATA', response.data.data);
          return response.data.data
        })
  },

  delete({rootState}, docId) {
    const http = http_with_auth(rootState.user.jwt);
    return http.delete(`/documents/${docId}`)
  },

  publish({commit, state}, docId) {
    return this.dispatch('document/save', {
        type: 'document',
        id: docId,
        attributes: {
          'is-published' : true
        }
    });
  },

  unpublish({commit, state}, docId) {
    return this.dispatch('document/save', {
        type: 'document',
        id: docId,
        attributes: {
          'is-published': false
        }
    });
  },
  fetchWitnessInstitution ({ commit, rootState }, witnessId) {
    const http = http_with_auth(rootState.user.jwt);

    return http.get(`/witnesses/${witnessId}?include=institution`).then( response => {
      const institution = getInstitution(response.data.included)
      if (institution.id === null) return null;
      commit('UPDATE_WITNESS_INSTITUTION', { witnessId, institution })
      return institution;
    });
  },
  removeWitnessInstitution({commit, rootState}, witnessId) {
    const http = http_with_auth(rootState.user.jwt);

    return http.patch(`/witnesses/${witnessId}/relationships/institution`, {data: null});
  },
  async addWitness ({rootState, state, dispatch}, witness) {
    const http = http_with_auth(rootState.user.jwt);

    witness.num = Math.max.apply(null, state.witnesses.map(w => w.num)) + 1; //TODO server side

    const witnessData = { ...witness }; //TODO probably useless if the incoming variable is expandable
    removeContentEditableAttributesFromObject(witnessData) //TODO utile?
    const institutionId = witness.institution ? witness.institution.id : null;
    delete(witnessData.id);
    delete(witnessData.institution);

    if (witnessData['classification-mark']) {
      witnessData.classification_mark = witnessData['classification-mark']
      delete(witnessData['classification-mark'])
    }

    const relationships = {
      document: {
        data: {
          id: state.document.id,
          type: "document"
        }
      }
    }
    if (institutionId) {
      relationships.institution = {
        data: {
          id: institutionId,
          type: "institution"
        }
      }
    }

    if (witness.images) {
      /* first we create all the new images */
      const imagesData = witness.images.map((i, index) => {
        return {
          attributes: {'canvas-id': i, 'order-num': index+1},
          type: 'image'  
        }
      })
  
      let imagesPromises = imagesData.map(data => http.post(`/images?without-relationships`, {data}))
      const imagesCreated = await Promise.all(imagesPromises)

      relationships.images = {
        data: imagesCreated.map(r => {return {id: r.data.data.id, type: 'image'}})    
      }

      delete(witnessData.images);
    }

    const data = {
        type: "witness",
        attributes: witnessData,
        relationships
    };

    await http.post(`/witnesses?without-relationships`, {data})
    await dispatch("fetch", state.document.id)
    return true
  },


  async updateWitness ({commit, rootState, state}, witness) {

    console.log("update witness", witness)
    const http = http_with_auth(rootState.user.jwt);

    const attributes = {...witness}
    removeContentEditableAttributesFromObject(attributes)
    const institutionId = witness.institution ? witness.institution.id : null;
    delete (attributes.id)
    delete (attributes.institution)
    delete (attributes['manifest_url'])

    if (attributes['classification-mark']) {
      attributes.classification_mark = attributes['classification-mark']
      delete (attributes['classification-mark'])
    }

    const relationships = {
      document: {
        data: {
          id: state.document.id,
          type: "document"
        }
      }
    }
    if (institutionId) {
      relationships.institution = {
        data: {
          id: institutionId,
          type: "institution"
        }
      }
    }

    if (witness.images) {
      const imagesData = witness.images.map((i, index) => {
        return {
          attributes: {'canvas-id': i, 'order-num': index+1},
          type: 'image'  
        }
      })
  
      let imagesPromises = imagesData.map(data => http.post(`/images?without-relationships`, {data}))
      const imagesCreated = await Promise.all(imagesPromises)

      relationships.images = {
        data: imagesCreated.map(r => {return {id: r.data.data.id, type: 'image'}})    
      }

      delete(attributes.images);
    }

    const data = {
        id : witness.id,
        type: "witness",
        attributes: attributes,
        relationships
    }

    return http.patch(`witnesses/${witness.id}?without-relationships`, {data})
      .then(response => {
        commit('UPDATE_WITNESS', witness);
      })
  },
  async removeWitness ({commit, state, rootState}, witness) {
    const http = http_with_auth(rootState.user.jwt);

    const data = { data: { id : witness.id, type: "witness" } };
    console.log('document store removeWitness', data, state.document.id);

    let response = await http.delete(`/witnesses/${witness.id}`, {data});
    if (response.status === 204) {
      commit('REMOVE_WITNESS', witness.id);
      return true;
    } else {
      return false;
    }
  },
  async reorderWitnesses ({commit, rootState, dispatch}, { witnesses }) {
    const http = http_with_auth(rootState.user.jwt);
    Promise.all(witnesses.map(w => {
      return http.patch(`/witnesses/${w.id}`, { data: {
        type: "witness",
        id: w.id,
        attributes: { num: w.num }
      }})
    })).then(() => {
      commit('REORDER_WITNESSES', witnesses)
      dispatch("fetch", state.document.id)
    })
  },

  addPerson ({commit}, person) {
    commit('ADD_PERSON', person)
  },
  removePerson ({commit}, relationId) {
    commit('REMOVE_PERSON', relationId)
  },

  addPlacename({commit}, placename) {
    commit('ADD_PLACENAME', placename)
  },
  removePlacename({commit}, relationId) {
    commit('REMOVE_PLACENAME', relationId)
  },
  setIsLoading({commit}) {
    commit('LOADING_STATUS', true);
  },
  unsetIsLoading({commit}) {
    commit('LOADING_STATUS', false);
  },
  async addCollection ({rootState, state, dispatch}, collection) {

    const data = { data: [ { id : collection.id, type: "collection" }, ] }

    const http = http_with_auth(rootState.user.jwt);
    await http.post(`/documents/${state.document.id}/relationships/collections?without-relationships`, data)
    await dispatch("fetch", state.document.id)
    return true
  },
  async removeCollection ({state, rootState, dispatch}, collection) {
    const data = { data: { id : collection.id, type: "collection" } };

    const http = http_with_auth(rootState.user.jwt);
    await http.delete(`/documents/${state.document.id}/relationships/collections?without-relationships`, {data})
    await dispatch("fetch", state.document.id)
    return true
  },

  addNote ({commit, state, rootState}, note) {
    console.log('store addNote', note)
    const data = {
      type: 'note',
      attributes: { content: note.content },
      relationships: {
        document: {
          data : [{ type: 'document', id: state.document.id }]
        }
      }
    }
    
    const http = http_with_auth(rootState.user.jwt);
    return http.post(`notes?without-relationships`, {data})
      .then(response => {
        console.log('response', response.data)
        let storeNote = [response.data.data].map(({id, attributes}) => ({ id: id, content: attributes.content, occurences: attributes.occurences }))[0]
        console.log("storeNote", storeNote)
        commit('ADD_NOTE', storeNote);
        return storeNote;
      })
  },
  updateNote ({commit, state, rootState}, note) {
    console.log('store updateNote', note)
    const data = {
      id: note.id,
      type: 'note',
      attributes: {
        content: note.content,
        occurences: note.occurences
      }
    }
    console.log("doc index.js updateNote / note : ", note)
    const http = http_with_auth(rootState.user.jwt);
    return http.patch(`notes/${note.id}?without-relationships`, {data})
      .then(response => {
        console.log('store updateNote response', response.data.data)
        let storeNote = [response.data.data].map(({id, attributes}) => ({ id: id, content: attributes.content, occurences: attributes.occurences }))[0]
        commit('UPDATE_NOTE', storeNote);
        return storeNote;
      })
  },
  removeNote ({commit, state, rootState}, noteId) {

    const http = http_with_auth(rootState.user.jwt);
    return http.delete(`notes/${noteId}?without-relationships`)
      .then(response => {
        console.log('response', response)
        commit('REMOVE_NOTE', noteId);
        return noteId;
      })
  },

  initializeDummyDocument({commit, state, rootState}, defaultData) {
    const collId = defaultData.relationships.collections.data[0].id;
    
    const http = http_with_auth(rootState.user.jwt);
    return http.get(`collections/${collId}`).then(r => {
      const collection = r.data.data;
      this.dispatch('document/resetDocumentState');
      const dummy = makeDummyDocument(defaultData);
      commit('UPDATE_DOCUMENT', {data: dummy.data, included: [collection]});
    });
  }

};

const getters = {

  documentSender (state) {
    return state.persons ? state.persons.filter( corr => {
      if (!corr.role) return false;
      return corr.role.label === 'sender'
    }) : false
  },
  documentRecipients (state) {
    return state.persons ? state.persons.filter( corr => {
      if (!corr.role) return false;
      return corr.role.label === 'recipient'
    }) : false
  },

  locationDateFrom(state) {
    return state.placenames ? state.placenames.filter(corr => {
      if (!corr.role) return false;
      console.warn(corr.role.label);
      return corr.role.label === 'location-date-from'
    }) : false
  },
  locationDateTo(state) {
    return state.placenames ? state.placenames.filter(corr => {
      if (!corr.role) return false;
      return corr.role.label === 'location-date-to'
    }) : false
  },
  getDummyDocument: (state) => (data) => {
    // this dummy document is used as a base when creating a new document
    return makeDummyDocument(data);
  },
  getDocumentStatus: (state, getters, rootState, rootGetters) => async (id) => {
    const incs = [
      'current-lock'
    ];

    const http = http_with_auth(rootState.user.jwt);

    const response = await http.get(`documents/${id}?include=${incs.join(',')}&without-relationships&facade=status`)
    const {data, included} = response.data

    const isBookmarked = await http.get(`/users/${rootState.user.current_user.id}/relationships/bookmarks`).then(
      response => response.data.data.filter(d => d.id === id).length > 0
    )

    let status = {
      id,
      isPublished: data.attributes['is-published'],
      isBookmarked,
      currentLock: getCurrentLock(included)
    }

    return status;
  }
};

const documentModule = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};

export default documentModule;
