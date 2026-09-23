import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Textarea } from '../common/Input';
import type { Attachment } from '../../types';
import { apiClient } from '../../api/client';
import { validateFile } from '../../utils/validators';
import { ACCEPTED_FILE_LABEL, ACCEPTED_FILE_TYPES } from '../../utils/constants';
import { formatFileSize } from '../../utils/formatters';

interface AnexarDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnexar: (file: File, descricao?: string) => Promise<void>;
  anexosExistentes?: Attachment[];
  onRemover?: (anexoId: string) => void;
}

export default function AnexarDocumentoModal({
  isOpen,
  onClose,
  onAnexar,
  anexosExistentes = [],
  onRemover,
}: AnexarDocumentoModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function handleFileChange(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }

  function handleClose() {
    setFile(null);
    setDescricao('');
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!file) {
      setError('Selecione um arquivo para anexar.');
      return;
    }

    setEnviando(true);
    try {
      await onAnexar(file, descricao || undefined);
      toast.success('Arquivo anexado com sucesso!');
      handleClose();
    } catch {
      toast.error('Não foi possível anexar o arquivo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Anexar Documento / Comprovação"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={enviando}>Anexar Arquivo</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileChange(e.dataTransfer.files[0] ?? null);
          }}
        >
          <p className="text-sm text-secondary">Arraste um arquivo aqui ou clique para procurar</p>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            Selecionar Arquivo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-secondary">Tipos aceitos: {ACCEPTED_FILE_LABEL}</p>
          <p className="text-xs text-secondary">Tamanho máximo: 10 MB</p>
        </div>

        {file && (
          <p className="text-sm text-ink">
            📎 {file.name} <span className="text-secondary">({formatFileSize(file.size)})</span>
          </p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Textarea
          label="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Ex: Comprovante de conclusão da atividade..."
        />

        {anexosExistentes.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-secondary">Anexos anteriores</p>
            <ul className="flex flex-col gap-2">
              {anexosExistentes.map((anexo) => (
                <li key={anexo.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      apiClient
                        .downloadFile(anexo.url, anexo.nome_arquivo)
                        .catch(() => toast.error('Não foi possível baixar o arquivo.'))
                    }
                    className="text-left hover:underline"
                  >
                    📎 {anexo.nome_arquivo} <span className="text-secondary">({formatFileSize(anexo.tamanho_bytes)})</span>
                  </button>
                  {onRemover && (
                    <button
                      type="button"
                      onClick={() => onRemover(anexo.id)}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
