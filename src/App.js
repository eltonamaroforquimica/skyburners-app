import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Calendar,
  Users,
  Trophy,
  Plus,
  Minus,
  Clock,
  MapPin,
  RotateCcw,
  X,
  Trash2,
  List,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";

const teamColorClasses = [
  { text: "text-blue-400", bg: "bg-blue-900/50", border: "border-blue-400" },
  { text: "text-red-400", bg: "bg-red-900/50", border: "border-red-400" },
  { text: "text-green-400", bg: "bg-green-900/50", border: "border-green-400" },
  {
    text: "text-yellow-400",
    bg: "bg-yellow-900/50",
    border: "border-yellow-400",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("eventos");
  const [eventos, setEventos] = useState([]);
  const [novoParticipante, setNovoParticipante] = useState({
    nome: "",
    sexo: "M",
    idade: "",
  });
  const [novoEvento, setNovoEvento] = useState({
    data: "",
    horario: "",
    local: "",
  });

  useEffect(() => {
    const colecaoEventosRef = collection(db, "eventos");
    const unsubscribe = onSnapshot(colecaoEventosRef, (snapshot) => {
      const listaEventos = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(a.data) - new Date(b.data));
      setEventos(listaEventos);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoParticipante((prevState) => ({ ...prevState, [name]: value }));
  };

  const criarEvento = async () => {
    if (novoEvento.data && novoEvento.horario && novoEvento.local) {
      await addDoc(collection(db, "eventos"), {
        ...novoEvento,
        limite: 24,
        participantes: [],
        listaDeEspera: [],
        equipes: null,
        placar: [],
        partidaAtual: null,
      });
      setNovoEvento({ data: "", horario: "", local: "" });
      setActiveTab("eventos");
    }
  };

  const adicionarParticipante = async (eventoId) => {
    const nomeNormalizado = novoParticipante.nome.trim();
    if (!nomeNormalizado || !novoParticipante.sexo || !novoParticipante.idade) {
      alert("Por favor, preencha nome, sexo e idade.");
      return;
    }
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual) return;
    const jaConfirmado = eventoAtual.participantes.some(
      (p) => p.nome.toLowerCase() === nomeNormalizado.toLowerCase()
    );
    const naEspera = eventoAtual.listaDeEspera.some(
      (p) => p.nome.toLowerCase() === nomeNormalizado.toLowerCase()
    );
    if (jaConfirmado || naEspera) {
      alert("Este nome já está na lista.");
      return;
    }
    const participanteCompleto = {
      ...novoParticipante,
      nome: nomeNormalizado,
      idade: parseInt(novoParticipante.idade, 10),
      atrasado: false,
    };
    if (eventoAtual.participantes.length < eventoAtual.limite) {
      await updateDoc(eventoRef, {
        participantes: [
          ...eventoAtual.participantes,
          participanteCompleto,
        ].sort((a, b) => a.nome.localeCompare(b.nome)),
      });
    } else {
      await updateDoc(eventoRef, {
        listaDeEspera: [...eventoAtual.listaDeEspera, participanteCompleto],
      });
    }
  };

  const removerParticipante = async (eventoId, nomeParaRemover) => {
    const nomeNormalizado = nomeParaRemover.trim().toLowerCase();
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual) return;
    const estavaConfirmado = eventoAtual.participantes.some(
      (p) => p.nome.toLowerCase() === nomeNormalizado
    );
    let novosParticipantes = eventoAtual.participantes.filter(
      (p) => p.nome.toLowerCase() !== nomeNormalizado
    );
    const novaListaEspera = eventoAtual.listaDeEspera.filter(
      (p) => p.nome.toLowerCase() !== nomeNormalizado
    );
    if (estavaConfirmado && novaListaEspera.length > 0) {
      const promovido = novaListaEspera.shift();
      novosParticipantes.push(promovido);
    }
    await updateDoc(eventoRef, {
      participantes: novosParticipantes.sort((a, b) =>
        a.nome.localeCompare(b.nome)
      ),
      listaDeEspera: novaListaEspera,
    });
  };

  const deletarEvento = async (eventoId) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita."
      )
    ) {
      await deleteDoc(doc(db, "eventos", eventoId));
    }
  };

  const toggleAtrasado = async (eventoId, nomeJogador) => {
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual) return;
    const novosParticipantes = eventoAtual.participantes.map((p) =>
      p.nome.toLowerCase() === nomeJogador.toLowerCase()
        ? { ...p, atrasado: !p.atrasado }
        : p
    );
    await updateDoc(eventoRef, { participantes: novosParticipantes });
  };

  const sortearEquipes = async (eventoId) => {
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual) return;
    const jogadoresPresentes = eventoAtual.participantes.filter(
      (p) => !p.atrasado
    );

    if (eventoAtual.equipes === null) {
      if (jogadoresPresentes.length < 4) {
        alert(
          "São necessários pelo menos 4 jogadores presentes para o sorteio inicial."
        );
        return;
      }
      const jogadoresParaSortear = [...jogadoresPresentes].sort(
        () => Math.random() - 0.5
      );
      const novasEquipes = [];
      while (jogadoresParaSortear.length > 0) {
        novasEquipes.push(jogadoresParaSortear.splice(0, 6));
      }
      await updateDoc(eventoRef, {
        equipes: novasEquipes,
        placar: new Array(novasEquipes.length).fill(0),
        partidaAtual:
          novasEquipes.length > 1 ? { equipeAIndex: 0, equipeBIndex: 1 } : null,
      });
    } else {
      let equipesAtualizadas = JSON.parse(JSON.stringify(eventoAtual.equipes));
      const nomesNasEquipes = equipesAtualizadas.flat().map((p) => p.nome);
      const jogadoresParaAdicionar = jogadoresPresentes
        .filter((p) => !nomesNasEquipes.includes(p.nome))
        .sort(() => Math.random() - 0.5);
      const nomesParaRemover = nomesNasEquipes.filter(
        (nome) => !jogadoresPresentes.some((p) => p.nome === nome)
      );
      if (nomesParaRemover.length > 0) {
        equipesAtualizadas = equipesAtualizadas.map((equipe) =>
          equipe.filter((jogador) => !nomesParaRemover.includes(jogador.nome))
        );
      }
      let jogadoresRestantes = [...jogadoresParaAdicionar];
      equipesAtualizadas.forEach((equipe) => {
        while (equipe.length < 6 && jogadoresRestantes.length > 0) {
          equipe.push(jogadoresRestantes.shift());
        }
      });
      while (jogadoresRestantes.length > 0) {
        equipesAtualizadas.push(jogadoresRestantes.splice(0, 6));
      }
      const equipesFinais = equipesAtualizadas.filter((e) => e.length > 0);
      await updateDoc(eventoRef, {
        equipes: equipesFinais,
        placar:
          equipesFinais.length !== eventoAtual.placar.length
            ? new Array(equipesFinais.length).fill(0)
            : eventoAtual.placar,
        partidaAtual:
          equipesFinais.length > 1
            ? { equipeAIndex: 0, equipeBIndex: 1 }
            : null,
      });
    }
  };

  const selecionarEquipeParaPartida = async (eventoId, slot, selectedIndex) => {
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual) return;
    const novaPartida = {
      ...eventoAtual.partidaAtual,
      [slot === "A" ? "equipeAIndex" : "equipeBIndex"]: parseInt(
        selectedIndex,
        10
      ),
    };
    await updateDoc(eventoRef, { partidaAtual: novaPartida });
  };

  const atualizarPlacar = async (eventoId, equipeIndex, operacao) => {
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual) return;
    const novoPlacar = [...eventoAtual.placar];
    if (operacao === "add") novoPlacar[equipeIndex]++;
    else if (operacao === "subtract")
      novoPlacar[equipeIndex] = Math.max(0, novoPlacar[equipeIndex] - 1);
    else if (operacao === "reset") novoPlacar[equipeIndex] = 0;
    await updateDoc(eventoRef, { placar: novoPlacar });
  };

  const zerarPlacarCompleto = async (eventoId) => {
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoAtual = eventos.find((e) => e.id === eventoId);
    if (!eventoAtual || !eventoAtual.placar) return;
    await updateDoc(eventoRef, {
      placar: new Array(eventoAtual.placar.length).fill(0),
    });
  };

  const renderEventos = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Users className="w-5 h-5" /> Seus Dados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="nome"
            placeholder="Seu nome"
            value={novoParticipante.nome}
            onChange={handleInputChange}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="sexo"
            value={novoParticipante.sexo}
            onChange={handleInputChange}
            className="bg-gray-700 border-gray-600 text-white border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          <input
            type="number"
            name="idade"
            placeholder="Sua idade"
            value={novoParticipante.idade}
            onChange={handleInputChange}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid gap-4">
        {eventos.map((evento) => {
          const nomeLogado = novoParticipante.nome.trim().toLowerCase();
          const isConfirmado = evento.participantes.some(
            (p) => p.nome.toLowerCase() === nomeLogado
          );
          const isNaEspera = evento.listaDeEspera.some(
            (p) => p.nome.toLowerCase() === nomeLogado
          );
          const isLotado = evento.participantes.length >= evento.limite;
          const presentes = evento.participantes.filter((p) => !p.atrasado);
          const atrasados = evento.participantes.filter((p) => p.atrasado);
          let btnTexto = isConfirmado
            ? "Cancelar Presença"
            : isNaEspera
            ? "Sair da Fila"
            : isLotado
            ? "Entrar na Fila"
            : "Confirmar Presença";
          const handleParticipationClick = () => {
            isConfirmado || isNaEspera
              ? removerParticipante(evento.id, novoParticipante.nome)
              : adicionarParticipante(evento.id);
          };

          return (
            <div
              key={evento.id}
              className="bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Jogo - {new Date(evento.data).toLocaleDateString("pt-BR")}
                  </h3>
                  <div className="flex items-center flex-wrap gap-4 text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock size={16} /> {evento.horario}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={16} /> {evento.local}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={16} /> {evento.participantes.length} /{" "}
                      {evento.limite}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleParticipationClick}
                    disabled={!nomeLogado}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isConfirmado || isNaEspera
                        ? "bg-red-900/50 text-red-300 hover:bg-red-900/80"
                        : "bg-green-900/50 text-green-300 hover:bg-green-900/80"
                    }`}
                  >
                    {btnTexto}
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-300">
                  <UserCheck size={18} className="text-green-500" /> Presentes (
                  {presentes.length}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {presentes.map((p) => (
                    <button
                      key={p.nome}
                      onClick={() => toggleAtrasado(evento.id, p.nome)}
                      title="Marcar como Atrasado"
                      className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm hover:bg-red-900/50 hover:text-red-300 transition-colors"
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
              {atrasados.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-300">
                    <UserX size={18} className="text-red-500" /> Atrasados (
                    {atrasados.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {atrasados.map((p) => (
                      <button
                        key={p.nome}
                        onClick={() => toggleAtrasado(evento.id, p.nome)}
                        title="Marcar como Presente"
                        className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-sm hover:bg-green-900/50 hover:text-green-300 transition-colors"
                      >
                        {p.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {evento.listaDeEspera.length > 0 && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-300">
                    <List size={16} /> Fila de Espera (
                    {evento.listaDeEspera.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {evento.listaDeEspera.map((p, i) => (
                      <span
                        key={p.nome}
                        className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                      >
                        {i + 1}. {p.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-gray-700 pt-4 mt-4">
                {presentes.length >= 4 && (
                  <button
                    onClick={() => sortearEquipes(evento.id)}
                    className={`${
                      evento.equipes
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    } text-white px-6 py-2 rounded-lg flex items-center gap-2`}
                  >
                    <Trophy size={16} />{" "}
                    {evento.equipes ? "Atualizar Equipes" : "Sortear Equipes"}
                  </button>
                )}
              </div>
              {evento.equipes && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-200 mb-2">
                    Equipes Montadas
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {evento.equipes.map((equipe, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-300 mb-2">
                          Equipe {index + 1} ({equipe.length})
                        </h5>
                        <div className="space-y-1 text-sm text-gray-400">
                          {equipe.map((jogador) => (
                            <div key={jogador.nome}>
                              {jogador.nome}{" "}
                              <span className="text-xs text-gray-500">
                                ({jogador.sexo}
                                {jogador.idade})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCriarJogo = () => (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Plus className="w-5 h-5" /> Criar Novo Jogo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={novoEvento.data}
            onChange={(e) =>
              setNovoEvento({ ...novoEvento, data: e.target.value })
            }
            className="bg-gray-700 border-gray-600 text-white border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="time"
            value={novoEvento.horario}
            onChange={(e) =>
              setNovoEvento({ ...novoEvento, horario: e.target.value })
            }
            className="bg-gray-700 border-gray-600 text-white border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Local do jogo"
            value={novoEvento.local}
            onChange={(e) =>
              setNovoEvento({ ...novoEvento, local: e.target.value })
            }
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={criarEvento}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Criar Jogo
        </button>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
          <Trash2 className="w-5 h-5" /> Gerenciar Jogos
        </h3>
        <div className="space-y-3">
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <div
                key={evento.id}
                className="flex items-center justify-between bg-gray-700/50 p-3 rounded-md"
              >
                <div>
                  <p className="font-medium text-white">
                    {new Date(evento.data).toLocaleDateString("pt-BR")} -{" "}
                    {evento.horario}
                  </p>
                  <p className="text-sm text-gray-400">{evento.local}</p>
                </div>
                <button
                  onClick={() => deletarEvento(evento.id)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
                  title="Excluir Jogo"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhum jogo para gerenciar.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlacar = () => (
    <div className="space-y-6">
      {eventos
        .filter((e) => e.equipes && e.equipes.length > 1 && e.partidaAtual)
        .map((evento) => {
          const { equipeAIndex, equipeBIndex } = evento.partidaAtual;
          const corEquipeA =
            teamColorClasses[equipeAIndex % teamColorClasses.length];
          const corEquipeB =
            teamColorClasses[equipeBIndex % teamColorClasses.length];
          return (
            <div
              key={evento.id}
              className="bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <h3 className="text-xl font-semibold mb-4 text-center text-white">
                Placar - {new Date(evento.data).toLocaleDateString("pt-BR")}
              </h3>
              <div className="grid grid-cols-2 gap-4 items-center mb-6 border-b border-gray-700 pb-6">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Jogando como Time 1
                  </label>
                  <select
                    value={equipeAIndex}
                    onChange={(e) =>
                      selecionarEquipeParaPartida(
                        evento.id,
                        "A",
                        e.target.value
                      )
                    }
                    className={`w-full p-2 border rounded-md font-semibold bg-gray-700 border-gray-600 ${corEquipeA.border} ${corEquipeA.text}`}
                  >
                    {evento.equipes.map((_, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={index === equipeBIndex}
                      >
                        Equipe {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Jogando como Time 2
                  </label>
                  <select
                    value={equipeBIndex}
                    onChange={(e) =>
                      selecionarEquipeParaPartida(
                        evento.id,
                        "B",
                        e.target.value
                      )
                    }
                    className={`w-full p-2 border rounded-md font-semibold bg-gray-700 border-gray-600 ${corEquipeB.border} ${corEquipeB.text}`}
                  >
                    {evento.equipes.map((_, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={index === equipeAIndex}
                      >
                        Equipe {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <h4
                    className={`text-lg font-semibold mb-4 ${corEquipeA.text}`}
                  >
                    Equipe {equipeAIndex + 1}
                  </h4>
                  <div className={`text-6xl font-bold mb-4 ${corEquipeA.text}`}>
                    {evento.placar[equipeAIndex] || 0}
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() =>
                        atualizarPlacar(evento.id, equipeAIndex, "subtract")
                      }
                      className="bg-red-900/50 text-red-300 p-3 rounded-full hover:bg-red-900/80"
                    >
                      <Minus size={24} />
                    </button>
                    <button
                      onClick={() =>
                        atualizarPlacar(evento.id, equipeAIndex, "add")
                      }
                      className="bg-green-900/50 text-green-300 p-3 rounded-full hover:bg-green-900/80"
                    >
                      <Plus size={24} />
                    </button>
                    <button
                      onClick={() =>
                        atualizarPlacar(evento.id, equipeAIndex, "reset")
                      }
                      className="bg-gray-700 text-gray-300 p-3 rounded-full hover:bg-gray-600"
                      title={`Zerar equipe ${equipeAIndex + 1}`}
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                  {evento.equipes[equipeAIndex] && (
                    <div
                      className={`mt-4 text-sm p-2 rounded ${corEquipeA.bg}`}
                    >
                      {evento.equipes[equipeAIndex]
                        .map((p) => p.nome)
                        .join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h4
                    className={`text-lg font-semibold mb-4 ${corEquipeB.text}`}
                  >
                    Equipe {equipeBIndex + 1}
                  </h4>
                  <div className={`text-6xl font-bold mb-4 ${corEquipeB.text}`}>
                    {evento.placar[equipeBIndex] || 0}
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() =>
                        atualizarPlacar(evento.id, equipeBIndex, "subtract")
                      }
                      className="bg-red-900/50 text-red-300 p-3 rounded-full hover:bg-red-900/80"
                    >
                      <Minus size={24} />
                    </button>
                    <button
                      onClick={() =>
                        atualizarPlacar(evento.id, equipeBIndex, "add")
                      }
                      className="bg-green-900/50 text-green-300 p-3 rounded-full hover:bg-green-900/80"
                    >
                      <Plus size={24} />
                    </button>
                    <button
                      onClick={() =>
                        atualizarPlacar(evento.id, equipeBIndex, "reset")
                      }
                      className="bg-gray-700 text-gray-300 p-3 rounded-full hover:bg-gray-600"
                      title={`Zerar equipe ${equipeBIndex + 1}`}
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                  {evento.equipes[equipeBIndex] && (
                    <div
                      className={`mt-4 text-sm p-2 rounded ${corEquipeB.bg}`}
                    >
                      {evento.equipes[equipeBIndex]
                        .map((p) => p.nome)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center mt-8 border-t border-gray-700 pt-6">
                <button
                  onClick={() => zerarPlacarCompleto(evento.id)}
                  className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2 mx-auto"
                >
                  <Shield size={16} /> Zerar Placar Geral
                </button>
              </div>
            </div>
          );
        })}
      {eventos.filter((e) => e.equipes && e.equipes.length > 1).length ===
        0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Nenhum jogo com equipes sorteadas para exibir o placar.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="SkyBurners Logo"
                className="w-12 h-12"
              />
              <h1 className="text-3xl font-bold text-white">SkyBurners</h1>
            </div>
          </div>
        </div>
      </header>
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("eventos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "eventos"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Eventos
            </button>
            <button
              onClick={() => setActiveTab("criar")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "criar"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Criar Jogo
            </button>
            <button
              onClick={() => setActiveTab("placar")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "placar"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Placar
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "eventos" && renderEventos()}
        {activeTab === "criar" && renderCriarJogo()}
        {activeTab === "placar" && renderPlacar()}
      </main>
    </div>
  );
}
